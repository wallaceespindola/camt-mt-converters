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
} from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import RefreshIcon from '@mui/icons-material/Refresh'
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
  count: number
  successRate: number
}

interface EngineMetric {
  engine: string
  avgDuration: number
  count: number
}

interface StatusMetric {
  status: string
  count: number
}

interface RunPoint {
  run: number
  duration: number
  format: string
}

function deriveMetrics(jobs: ConversionJobStatus[]) {
  // --- By format ---
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
    const avg =
      durs.length > 0 ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0
    const total = formatCountMap.get(fmt) ?? 0
    const success = formatSuccessMap.get(fmt) ?? 0
    return {
      format: fmt,
      avgDuration: avg,
      count: total,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    }
  })

  // --- By engine ---
  const engineDurMap = new Map<string, number[]>()
  const engineCountMap = new Map<string, number>()

  for (const job of jobs) {
    if (job.status !== 'COMPLETED' || job.durationMs <= 0) continue
    const eng = job.engine
    if (!engineDurMap.has(eng)) engineDurMap.set(eng, [])
    engineDurMap.get(eng)!.push(job.durationMs)
    engineCountMap.set(eng, (engineCountMap.get(eng) ?? 0) + 1)
  }

  const engineMetrics: EngineMetric[] = Array.from(engineDurMap.keys()).map((eng) => {
    const durs = engineDurMap.get(eng) ?? []
    const avg = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
    return { engine: eng, avgDuration: avg, count: engineCountMap.get(eng) ?? 0 }
  })

  // --- Last 20 runs chronologically ---
  const last20: RunPoint[] = jobs
    .filter((j) => j.durationMs > 0)
    .sort((a, b) => a.jobId - b.jobId)
    .slice(-20)
    .map((j, i) => ({ run: i + 1, duration: j.durationMs, format: j.targetFormat }))

  // --- By status ---
  const statusMap = new Map<string, number>()
  for (const job of jobs) {
    statusMap.set(job.status, (statusMap.get(job.status) ?? 0) + 1)
  }
  const statusMetrics: StatusMetric[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status, count }),
  )

  return { formatMetrics, engineMetrics, last20, statusMetrics }
}

function SummaryCard({ metric }: { metric: FormatMetric }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Chip
            label={metric.format}
            size="small"
            sx={{
              bgcolor: FORMAT_COLORS[metric.format] ?? '#9E9E9E',
              color: 'white',
              fontWeight: 700,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {metric.count} jobs
          </Typography>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" fontSize={11}>
              Avg Duration
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary">
              {metric.avgDuration > 0 ? `${metric.avgDuration} ms` : '—'}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="body2" color="text.secondary" fontSize={11}>
              Success Rate
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              color={metric.successRate >= 80 ? 'success.main' : 'error.main'}
            >
              {metric.successRate}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function ConversionChartsView() {
  const {
    data: jobs,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <BarChartIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>
            Conversion Charts
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            Auto-refreshes every 30s
          </Typography>
          <Tooltip title="Refresh now">
            <IconButton onClick={() => void refetch()} size="small" disabled={isFetching}>
              {isFetching ? <CircularProgress size={18} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={48} />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load job data. Ensure the backend is running on port 8080.
        </Alert>
      )}

      {!isLoading && !isError && !hasJobs && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No conversion jobs found yet. Run some conversions first using the Conversion Runner,
          then return here to see performance analytics.
        </Alert>
      )}

      {hasJobs && (
        <Grid container spacing={3}>
          {/* Summary Cards per Format */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} mb={1.5}>
              Summary by Format
            </Typography>
            <Grid container spacing={2}>
              {formatMetrics.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.format}>
                  <SummaryCard metric={m} />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Bar Chart: Avg Duration by Format */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Avg Duration by Format (ms)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={formatMetrics}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="format" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit=" ms" />
                    <RechartsTooltip formatter={(v) => [`${String(v)} ms`, 'Avg Duration']} />
                    <Bar dataKey="avgDuration" name="Avg Duration (ms)">
                      {formatMetrics.map((entry) => (
                        <Cell
                          key={entry.format}
                          fill={FORMAT_COLORS[entry.format] ?? '#9E9E9E'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Bar Chart: Avg Duration by Engine */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Avg Duration by Engine (ms)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {engineMetrics.length === 0 ? (
                  <Alert severity="info">No completed jobs with duration data available.</Alert>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={engineMetrics}
                      margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="engine" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} unit=" ms" />
                      <RechartsTooltip
                        formatter={(v) => [`${String(v)} ms`, 'Avg Duration']}
                      />
                      <Bar dataKey="avgDuration" name="Avg Duration (ms)">
                        {engineMetrics.map((entry) => (
                          <Cell
                            key={entry.engine}
                            fill={ENGINE_COLORS[entry.engine] ?? '#9E9E9E'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Line Chart: Duration over last 20 runs */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Duration over Last {Math.min(20, last20.length)} Runs (ms)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {last20.length === 0 ? (
                  <Alert severity="info">No duration data available yet.</Alert>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={last20}
                      margin={{ top: 8, right: 16, left: 0, bottom: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="run"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Run #', position: 'insideBottom', offset: -8 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} unit=" ms" />
                      <RechartsTooltip
                        formatter={(value, _name, props: { payload?: RunPoint }) => [
                          `${String(value)} ms`,
                          props.payload?.format ?? 'Duration',
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke="#E64A19"
                        strokeWidth={2}
                        dot={{ fill: '#E64A19', r: 4 }}
                        name="Duration (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Bar Chart: Jobs by Status */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Jobs by Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={statusMetrics}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(v) => [v, 'Jobs']} />
                    <Bar dataKey="count" name="Jobs">
                      {statusMetrics.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? '#9E9E9E'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
