import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
  Tooltip,
  IconButton,
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import PendingIcon from '@mui/icons-material/Pending'
import InboxIcon from '@mui/icons-material/Inbox'
import { getConversionJobs, type ConversionJobStatus } from '../api/client'

function StatusChip({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <Chip icon={<CheckCircleIcon />} label="COMPLETED" color="success" size="small" />
    case 'FAILED':
      return <Chip icon={<ErrorIcon />} label="FAILED" color="error" size="small" />
    case 'STARTED':
    case 'STARTING':
      return <Chip icon={<HourglassEmptyIcon />} label={status} color="warning" size="small" />
    default:
      return <Chip icon={<PendingIcon />} label={status} color="default" size="small" />
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function JobRow({ job }: { job: ConversionJobStatus }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="primary">
          #{job.jobId}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={job.targetFormat}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: formatChipBg(job.targetFormat),
            color: 'white',
          }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">{job.engine}</Typography>
      </TableCell>
      <TableCell>
        <StatusChip status={job.status} />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {job.durationMs > 0 ? `${job.durationMs} ms` : '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          sx={{ fontSize: 11, maxWidth: 220, wordBreak: 'break-all' }}
          color="text.secondary"
        >
          {job.outputFile || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontSize: 11 }}>
          {formatDate(job.startTime)}
        </Typography>
      </TableCell>
    </TableRow>
  )
}

function formatChipBg(format: string): string {
  switch (format) {
    case 'MT940':
      return '#E64A19'
    case 'MT942':
      return '#FF9800'
    case 'CAMT052':
      return '#FFC107'
    case 'CAMT053':
      return '#FF7043'
    default:
      return '#9E9E9E'
  }
}

export default function ConversionHistoryView() {
  const { data: jobs, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['conversionJobs'],
    queryFn: getConversionJobs,
    refetchInterval: 15_000,
  })

  const sortedJobs = [...(jobs ?? [])].sort((a, b) => b.jobId - a.jobId)

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>
            Conversion History
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            Auto-refreshes every 15s
          </Typography>
          <Tooltip title="Refresh now">
            <IconButton onClick={() => void refetch()} size="small" disabled={isFetching}>
              {isFetching ? <CircularProgress size={18} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && (
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Alert severity="error">
          Failed to load job history. Ensure the backend is running on port 8080.
        </Alert>
      )}

      {!isLoading && !isError && sortedJobs.length === 0 && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <InboxIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No conversion jobs found
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={1}>
              Run your first conversion in the Conversion Runner to see history here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {sortedJobs.length > 0 && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''} total
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label={`${sortedJobs.filter((j) => j.status === 'COMPLETED').length} completed`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`${sortedJobs.filter((j) => j.status === 'FAILED').length} failed`}
                  color="error"
                  size="small"
                />
              </Box>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Job ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Format
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Engine
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Duration
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Output File
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
                      Started At
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedJobs.map((job) => (
                    <JobRow key={job.jobId} job={job} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
