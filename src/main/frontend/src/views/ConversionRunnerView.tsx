import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PendingIcon from '@mui/icons-material/Pending'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import {
  runConversion,
  type ConversionTargetFormat,
  type ConversionEngine,
  type ConversionJobResponse,
} from '../api/client'

const TARGET_FORMATS: ConversionTargetFormat[] = ['MT940', 'MT942', 'CAMT052', 'CAMT053']
const ENGINES: ConversionEngine[] = ['PROWIDE', 'VELOCITY', 'JAKARTA_XML_BINDING']

type CombinationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

interface RunAllRow {
  format: ConversionTargetFormat
  engine: 'PROWIDE' | 'VELOCITY'
  status: CombinationStatus
  durationMs: number | null
  jobId: number | null
  outputFile: string | null
}

function StatusChip({ status }: { status: CombinationStatus | string }) {
  switch (status) {
    case 'COMPLETED':
      return <Chip icon={<CheckCircleIcon />} label="COMPLETED" color="success" size="small" />
    case 'FAILED':
      return <Chip icon={<ErrorIcon />} label="FAILED" color="error" size="small" />
    case 'RUNNING':
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="RUNNING"
          color="warning"
          size="small"
        />
      )
    default:
      return <Chip icon={<PendingIcon />} label="PENDING" color="default" size="small" />
  }
}

const ALL_COMBINATIONS: RunAllRow[] = TARGET_FORMATS.flatMap((format) =>
  (['PROWIDE', 'VELOCITY'] as const).map((engine) => ({
    format,
    engine,
    status: 'PENDING' as CombinationStatus,
    durationMs: null,
    jobId: null,
    outputFile: null,
  })),
)

export default function ConversionRunnerView() {
  const [statementId, setStatementId] = useState<string>('')
  const [targetFormat, setTargetFormat] = useState<ConversionTargetFormat>('MT940')
  const [engine, setEngine] = useState<ConversionEngine>('PROWIDE')
  const [singleResult, setSingleResult] = useState<ConversionJobResponse | null>(null)
  const [runAllRows, setRunAllRows] = useState<RunAllRow[]>([])
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [runAllCompleted, setRunAllCompleted] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('lastStatementId')
    if (saved) setStatementId(saved)
  }, [])

  const singleMutation = useMutation({
    mutationFn: () =>
      runConversion({
        statementId: Number(statementId),
        targetFormat,
        engine,
      }),
    onSuccess: (data) => {
      setSingleResult(data)
    },
  })

  const handleSingleRun = () => {
    setSingleResult(null)
    singleMutation.mutate()
  }

  const handleRunAll = async () => {
    if (!statementId || isNaN(Number(statementId))) return

    const rows: RunAllRow[] = ALL_COMBINATIONS.map((c) => ({ ...c, status: 'PENDING' }))
    setRunAllRows(rows)
    setIsRunningAll(true)
    setRunAllCompleted(0)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      setRunAllRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'RUNNING' } : r)),
      )

      const start = Date.now()
      try {
        const result = await runConversion({
          statementId: Number(statementId),
          targetFormat: row.format,
          engine: row.engine,
        })
        const duration = Date.now() - start
        setRunAllRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: 'COMPLETED',
                  durationMs: duration,
                  jobId: result.jobId,
                  outputFile: result.outputFile,
                }
              : r,
          ),
        )
      } catch {
        const duration = Date.now() - start
        setRunAllRows((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'FAILED', durationMs: duration } : r,
          ),
        )
      }
      setRunAllCompleted(i + 1)
    }
    setIsRunningAll(false)
  }

  const progressPercent =
    runAllRows.length > 0 ? (runAllCompleted / runAllRows.length) * 100 : 0

  const isStatementIdValid = statementId.trim() !== '' && !isNaN(Number(statementId))

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <PlayArrowIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>
          Conversion Runner
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Statement ID"
                  value={statementId}
                  onChange={(e) => setStatementId(e.target.value)}
                  helperText="Use an ID returned from the Generate step"
                  type="number"
                  size="small"
                  fullWidth
                  inputProps={{ min: 1 }}
                  error={statementId !== '' && isNaN(Number(statementId))}
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Target Format</InputLabel>
                  <Select
                    value={targetFormat}
                    label="Target Format"
                    onChange={(e) => setTargetFormat(e.target.value as ConversionTargetFormat)}
                  >
                    {TARGET_FORMATS.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Engine</InputLabel>
                  <Select
                    value={engine}
                    label="Engine"
                    onChange={(e) => setEngine(e.target.value as ConversionEngine)}
                  >
                    {ENGINES.map((e) => (
                      <MenuItem key={e} value={e}>
                        {e}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={
                    singleMutation.isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  disabled={singleMutation.isPending || !isStatementIdValid || isRunningAll}
                  onClick={handleSingleRun}
                  size="large"
                >
                  {singleMutation.isPending ? 'Running...' : 'Run Conversion'}
                </Button>

                <Divider />

                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={
                    isRunningAll ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PlaylistPlayIcon />
                    )
                  }
                  disabled={isRunningAll || !isStatementIdValid || singleMutation.isPending}
                  onClick={() => void handleRunAll()}
                  size="large"
                >
                  {isRunningAll ? 'Running All...' : 'Run All Combinations (8)'}
                </Button>

                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Runs all 4 formats × 2 engines (PROWIDE + VELOCITY) sequentially
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={8}>
          {/* Single Result */}
          {singleMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Conversion failed:{' '}
              {singleMutation.error instanceof Error
                ? singleMutation.error.message
                : 'Unknown error'}
            </Alert>
          )}

          {singleResult && !singleMutation.isPending && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="h6" fontWeight={600}>
                    Conversion Result
                  </Typography>
                  <Chip
                    label={singleResult.status}
                    color={singleResult.status === 'COMPLETED' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1} mb={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Job ID
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      #{singleResult.jobId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Format
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {singleResult.targetFormat}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Engine
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {singleResult.engine}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Output File
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ wordBreak: 'break-all' }}
                      color="primary"
                    >
                      {singleResult.outputFile}
                    </Typography>
                  </Grid>
                </Grid>

                {singleResult.fileContent && (
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      File Preview (first 6000 chars):
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 320,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        border: '1px solid',
                        borderColor: 'divider',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {singleResult.fileContent.substring(0, 6000)}
                      {singleResult.fileContent.length > 6000 && '\n... (truncated)'}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Run All Results Table */}
          {runAllRows.length > 0 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="h6" fontWeight={600}>
                    All Combinations Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {runAllCompleted} / {runAllRows.length}
                  </Typography>
                </Box>

                {isRunningAll && (
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                    color="primary"
                  />
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Format</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Engine</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Duration</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Job ID</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Output File</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {runAllRows.map((row, idx) => (
                        <TableRow
                          key={idx}
                          sx={{
                            bgcolor:
                              row.status === 'RUNNING'
                                ? (theme) =>
                                    theme.palette.mode === 'dark'
                                      ? 'warning.dark'
                                      : 'warning.50'
                                : undefined,
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {row.format}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.engine}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip status={row.status} />
                          </TableCell>
                          <TableCell>
                            {row.durationMs !== null ? (
                              <Typography variant="body2">{row.durationMs} ms</Typography>
                            ) : row.status === 'RUNNING' ? (
                              <CircularProgress size={14} />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {row.jobId !== null ? (
                              <Typography variant="body2">#{row.jobId}</Typography>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: 11, wordBreak: 'break-all', maxWidth: 200 }}
                              color="primary"
                            >
                              {row.outputFile ?? '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {!isRunningAll && runAllCompleted === runAllRows.length && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    All {runAllRows.length} combinations completed. Check the History and Charts
                    views for details.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!singleResult && runAllRows.length === 0 && !singleMutation.isPending && (
            <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <PlayArrowIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  No conversions run yet
                </Typography>
                <Typography variant="body2" color="text.disabled" mt={1}>
                  Enter a Statement ID and click Run Conversion or Run All Combinations
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
