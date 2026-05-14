import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { getConversionJobs, type ConversionJobStatus } from '../api/client'

const FORMAT_COLORS: Record<string, string> = {
  MT940: '#E64A19',
  MT942: '#FF9800',
  CAMT052: '#FFC107',
  CAMT053: '#FF7043',
}

const ENGINE_COLORS: Record<string, string> = {
  PROWIDE: '#E64A19',
  VELOCITY: '#FF9800',
  JAKARTA_XML_BINDING: '#FFC107',
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#4CAF50',
  FAILED: '#F44336',
  STARTED: '#FF9800',
  STARTING: '#FF9800',
}

interface FormatMetric {
  format: string
  avgDuration: number
  throughputRps: number
  count: number
  successRate: number
}

interface EngineMetric {
  engine: string
  avgDuration: number
  throughputRps: number
  count: number
}

interface StatusMetric {
  status: string
  count: number
}

interface RunPoint {
  run: number
  duration: number
  throughput: number
  format: string
  engine: string
}

function deriveMetrics(jobs: ConversionJobStatus[]) {
  const formatDurMap = new Map<string, number[]>()
  const formatCountMap = new Map<string, number>()
  const formatSuccessMap = new Map<string, number>()

  for (const job of jobs) {
    const fmt = job.targetFormat
    formatCountMap.set(fmt, (formatCountMap.get(fmt) ?? 0) + 1)
    if (job.status === 'COMPLETED') {
      formatSuccessMap.set(fmt, (formatSuccessMap.get(fmt) ?? 0) + 1)
      if (job.durationMs > 0) {
        if (!formatDurMap.has(fmt)) formatDurMap.set(fmt, [])
        formatDurMap.get(fmt)!.push(job.durationMs)
      }
    }
  }

  const formatMetrics: FormatMetric[] = Array.from(formatCountMap.keys()).map((fmt) => {
    const durs = formatDurMap.get(fmt) ?? []
    const avg = durs.length > 0 ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0
    const throughput = avg > 0 ? Math.round((1000 / avg) * 100) / 100 : 0
    const total = formatCountMap.get(fmt) ?? 0
    const success = formatSuccessMap.get(fmt) ?? 0
    return { format: fmt, avgDuration: avg, throughputRps: throughput, count: total, successRate: total > 0 ? Math.round((success / total) * 100) : 0 }
  })

  const engineDurMap = new Map<string, number[]>()
  const engineCountMap = new Map<string, number>()
  for (const job of jobs) {
    if (job.status !== 'COMPLETED' || job.durationMs <= 0) continue
    if (!engineDurMap.has(job.engine)) engineDurMap.set(job.engine, [])
    engineDurMap.get(job.engine)!.push(job.durationMs)
    engineCountMap.set(job.engine, (engineCountMap.get(job.engine) ?? 0) + 1)
  }
  const engineMetrics: EngineMetric[] = Array.from(engineDurMap.keys()).map((eng) => {
    const durs = engineDurMap.get(eng) ?? []
    const avg = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
    const throughput = avg > 0 ? Math.round((1000 / avg) * 100) / 100 : 0
    return { engine: eng, avgDuration: avg, throughputRps: throughput, count: engineCountMap.get(eng) ?? 0 }
  }).sort((a, b) => b.throughputRps - a.throughputRps)

  const last20: RunPoint[] = jobs
    .filter((j) => j.durationMs > 0)
    .sort((a, b) => a.jobId - b.jobId)
    .slice(-20)
    .map((j, i) => ({
      run: i + 1,
      duration: j.durationMs,
      throughput: j.durationMs > 0 ? Math.round((1000 / j.durationMs) * 100) / 100 : 0,
      format: j.targetFormat,
      engine: j.engine,
    }))

  const statusMap = new Map<string, number>()
  for (const job of jobs) statusMap.set(job.status, (statusMap.get(job.status) ?? 0) + 1)
  const statusMetrics: StatusMetric[] = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

  return { formatMetrics, engineMetrics, last20, statusMetrics }
}

function exportCsv(jobs: ConversionJobStatus[]) {
  const header = 'jobId,targetFormat,engine,status,durationMs,outputFile,startTime,endTime'
  const rows = jobs.map((j) =>
    [j.jobId, j.targetFormat, j.engine, j.status, j.durationMs, j.outputFile ?? '', j.startTime ?? '', j.endTime ?? ''].join(',')
  )
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'benchmark-results.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportJson(jobs: ConversionJobStatus[]) {
  const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'benchmark-results.json'
  a.click()
  URL.revokeObjectURL(url)
}

function exportMarkdown(jobs: ConversionJobStatus[], formatMetrics: FormatMetric[], engineMetrics: EngineMetric[]) {
  const lines: string[] = [
    '# Benchmark Results — Banking Statement Converter',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Format Summary',
    '',
    '| Format | Avg Duration (ms) | Throughput (conv/s) | Jobs | Success Rate |',
    '|--------|-------------------|---------------------|------|--------------|',
    ...formatMetrics.map((m) => `| ${m.format} | ${m.avgDuration} | ${m.throughputRps} | ${m.count} | ${m.successRate}% |`),
    '',
    '## Engine Summary',
    '',
    '| Engine | Avg Duration (ms) | Throughput (conv/s) | Jobs |',
    '|--------|-------------------|---------------------|------|',
    ...engineMetrics.map((m) => `| ${m.engine} | ${m.avgDuration} | ${m.throughputRps} | ${m.count} |`),
    '',
    '## All Jobs',
    '',
    '| Job ID | Format | Engine | Status | Duration (ms) | Output File |',
    '|--------|--------|--------|--------|---------------|-------------|',
    ...jobs.map((j) => `| ${j.jobId} | ${j.targetFormat} | ${j.engine} | ${j.status} | ${j.durationMs} | ${j.outputFile ?? ''} |`),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'benchmark-results.md'
  a.click()
  URL.revokeObjectURL(url)
}

function FormatSummaryCard({ metric }: { metric: FormatMetric }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Chip label={metric.format} size="small" sx={{ bgcolor: FORMAT_COLORS[metric.format] ?? '#9E9E9E', color: 'white', fontWeight: 700 }} />
          <Typography variant="caption" color="text.secondary">{metric.count} jobs</Typography>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" fontSize={10}>Avg Duration</Typography>
            <Typography variant="body1" fontWeight={700} color="primary">
              {metric.avgDuration > 0 ? `${metric.avgDuration} ms` : '—'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" fontSize={10}>Throughput</Typography>
            <Typography variant="body1" fontWeight={700} color="secondary.main">
              {metric.throughputRps > 0 ? `${metric.throughputRps}/s` : '—'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" fontSize={10}>Success Rate</Typography>
            <Typography variant="body1" fontWeight={700} color={metric.successRate >= 80 ? 'success.main' : 'error.main'}>
              {metric.successRate}%
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default function BenchmarkDashboardView() {
  const { data: jobs, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['conversionJobs'],
    queryFn: getConversionJobs,
    refetchInterval: 30_000,
  })

  const hasJobs = (jobs?.length ?? 0) > 0
  const { formatMetrics, engineMetrics, last20, statusMetrics } = hasJobs
    ? deriveMetrics(jobs!)
    : { formatMetrics: [], engineMetrics: [], last20: [], statusMetrics: [] }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <SpeedIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>Benchmark Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Conversion performance metrics derived from job history
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {hasJobs && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                onClick={() => exportCsv(jobs!)}>CSV</Button>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                onClick={() => exportJson(jobs!)}>JSON</Button>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                onClick={() => exportMarkdown(jobs!, formatMetrics, engineMetrics)}>Markdown</Button>
            </Stack>
          )}
          <Tooltip title="Refresh now">
            <IconButton onClick={() => void refetch()} size="small" disabled={isFetching}>
              {isFetching ? <CircularProgress size={18} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && <Box display="flex" justifyContent="center" py={6}><CircularProgress size={48} /></Box>}
      {isError && <Alert severity="error">Failed to load benchmark data. Is the backend running?</Alert>}

      {!isLoading && !isError && !hasJobs && (
        <Alert severity="info">
          No conversion jobs yet. Run some conversions in the Conversion Runner, then return here to see benchmark metrics.
        </Alert>
      )}

      {hasJobs && (
        <Grid container spacing={3}>
          {/* Format Summary Cards */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} mb={1.5}>Format Summary</Typography>
            <Grid container spacing={2}>
              {formatMetrics.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.format}>
                  <FormatSummaryCard metric={m} />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Engine Summary Cards */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} mb={1.5}>Engine Summary</Typography>
            <Grid container spacing={2}>
              {engineMetrics.map((m) => (
                <Grid item xs={12} sm={4} key={m.engine}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Chip label={m.engine} size="small" sx={{ bgcolor: ENGINE_COLORS[m.engine] ?? '#9E9E9E', color: 'white', fontWeight: 700 }} />
                        <Typography variant="caption" color="text.secondary">{m.count} jobs</Typography>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" color="text.secondary">Avg Duration</Typography>
                          <Typography variant="body1" fontWeight={700} color="primary">{m.avgDuration} ms</Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary">Throughput</Typography>
                          <Typography variant="body1" fontWeight={700} color="secondary.main">{m.throughputRps}/s</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Avg Throughput by Format */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Avg Throughput by Format (conv/s)</Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={formatMetrics} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="format" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(v) => [`${String(v)} conv/s`, 'Throughput']} />
                    <Bar dataKey="throughputRps" name="Throughput (conv/s)">
                      {formatMetrics.map((e) => <Cell key={e.format} fill={FORMAT_COLORS[e.format] ?? '#9E9E9E'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Avg Duration by Format */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Avg Duration by Format (ms)</Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={formatMetrics} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="format" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit=" ms" />
                    <RechartsTooltip formatter={(v) => [`${String(v)} ms`, 'Avg Duration']} />
                    <Bar dataKey="avgDuration" name="Avg Duration (ms)">
                      {formatMetrics.map((e) => <Cell key={e.format} fill={FORMAT_COLORS[e.format] ?? '#9E9E9E'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Avg Duration by Engine */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Avg Duration by Engine (ms)</Typography>
                <Divider sx={{ mb: 2 }} />
                {engineMetrics.length === 0 ? (
                  <Alert severity="info">No completed jobs with duration data.</Alert>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={engineMetrics} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="engine" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} unit=" ms" />
                      <RechartsTooltip formatter={(v) => [`${String(v)} ms`, 'Avg Duration']} />
                      <Bar dataKey="avgDuration" name="Avg Duration (ms)">
                        {engineMetrics.map((e) => <Cell key={e.engine} fill={ENGINE_COLORS[e.engine] ?? '#9E9E9E'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Jobs by Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Jobs by Status</Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusMetrics} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(v) => [v, 'Jobs']} />
                    <Bar dataKey="count" name="Jobs">
                      {statusMetrics.map((e) => <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? '#9E9E9E'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Throughput over runs */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Throughput over Last {Math.min(20, last20.length)} Runs (conv/s)</Typography>
                <Divider sx={{ mb: 2 }} />
                {last20.length === 0 ? <Alert severity="info">No data yet.</Alert> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={last20} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="run" tick={{ fontSize: 12 }} label={{ value: 'Run #', position: 'insideBottom', offset: -8 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(value, _name, props: { payload?: RunPoint }) => [`${String(value)} conv/s`, props.payload?.format ?? 'Throughput']} />
                      <Legend />
                      <Line type="monotone" dataKey="throughput" stroke="#FF9800" strokeWidth={2} dot={{ fill: '#FF9800', r: 4 }} name="Throughput (conv/s)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Duration over runs */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Duration over Last {Math.min(20, last20.length)} Runs (ms)</Typography>
                <Divider sx={{ mb: 2 }} />
                {last20.length === 0 ? <Alert severity="info">No data yet.</Alert> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={last20} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="run" tick={{ fontSize: 12 }} label={{ value: 'Run #', position: 'insideBottom', offset: -8 }} />
                      <YAxis tick={{ fontSize: 12 }} unit=" ms" />
                      <RechartsTooltip formatter={(value, _name, props: { payload?: RunPoint }) => [`${String(value)} ms`, props.payload?.format ?? 'Duration']} />
                      <Legend />
                      <Line type="monotone" dataKey="duration" stroke="#E64A19" strokeWidth={2} dot={{ fill: '#E64A19', r: 4 }} name="Duration (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
