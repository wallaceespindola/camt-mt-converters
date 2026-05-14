import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Skeleton,
  Tooltip,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import HistoryIcon from '@mui/icons-material/History'
import BarChartIcon from '@mui/icons-material/BarChart'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FavoriteIcon from '@mui/icons-material/Favorite'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { getHealth, getInfo, getConversionJobs } from '../api/client'

function HealthChip({ status }: { status: string }) {
  const isUp = status === 'UP'
  return (
    <Chip
      icon={isUp ? <CheckCircleIcon /> : <ErrorIcon />}
      label={status}
      color={isUp ? 'success' : 'error'}
      size="small"
      sx={{ fontWeight: 700, fontSize: 13 }}
    />
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color?: string
}) {
  return (
    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
      <CardContent>
        <Typography variant="h3" fontWeight={700} color={color ?? 'primary'}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

const QUICK_ACTIONS = [
  {
    label: 'Generate Statement Data',
    description: 'Create random bank statements and transactions in the H2 database',
    icon: <AddCircleOutlineIcon sx={{ fontSize: 36, color: '#E64A19' }} />,
    path: '/generate',
    internal: true,
  },
  {
    label: 'Run Conversion',
    description: 'Convert a statement to MT940, MT942, CAMT052, or CAMT053 via Spring Batch',
    icon: <PlayArrowIcon sx={{ fontSize: 36, color: '#E64A19' }} />,
    path: '/convert',
    internal: true,
  },
  {
    label: 'View History',
    description: 'Browse all past conversion jobs and their statuses',
    icon: <HistoryIcon sx={{ fontSize: 36, color: '#E64A19' }} />,
    path: '/history',
    internal: true,
  },
  {
    label: 'View Charts',
    description: 'Performance benchmarks and job analytics by format and engine',
    icon: <BarChartIcon sx={{ fontSize: 36, color: '#E64A19' }} />,
    path: '/charts',
    internal: true,
  },
  {
    label: 'Swagger UI',
    description: 'Interactive REST API documentation powered by OpenAPI 3',
    icon: <OpenInNewIcon sx={{ fontSize: 36, color: '#FF9800' }} />,
    path: 'http://localhost:8080/swagger-ui/index.html',
    internal: false,
  },
  {
    label: 'Actuator Health',
    description: 'Spring Boot Actuator health and info endpoints',
    icon: <FavoriteIcon sx={{ fontSize: 36, color: '#FF9800' }} />,
    path: 'http://localhost:8080/actuator/health',
    internal: false,
  },
]

export default function DashboardView() {
  const navigate = useNavigate()

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  })

  const infoQuery = useQuery({
    queryKey: ['info'],
    queryFn: getInfo,
    staleTime: 60_000,
  })

  const jobsQuery = useQuery({
    queryKey: ['conversionJobs'],
    queryFn: getConversionJobs,
    refetchInterval: 30_000,
  })

  const jobs = jobsQuery.data ?? []
  const totalJobs = jobs.length
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length
  const failedJobs = jobs.filter((j) => j.status === 'FAILED').length

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Health Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" fontWeight={600}>
                  System Health
                </Typography>
                {healthQuery.isLoading ? (
                  <CircularProgress size={20} />
                ) : healthQuery.isError ? (
                  <Tooltip title="Could not reach backend">
                    <HelpOutlineIcon color="warning" />
                  </Tooltip>
                ) : (
                  <HealthChip status={healthQuery.data?.status ?? 'UNKNOWN'} />
                )}
              </Box>
              <Divider sx={{ my: 1 }} />
              {healthQuery.isError && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Backend unreachable — ensure Spring Boot is running on port 8080.
                </Alert>
              )}
              {healthQuery.data && (
                <Typography variant="body2" color="text.secondary">
                  Spring Boot Actuator reporting status:{' '}
                  <strong>{healthQuery.data.status}</strong>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* App Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Application Info
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {infoQuery.isLoading && <Skeleton variant="rectangular" height={60} />}
              {infoQuery.isError && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Info endpoint not available.
                </Alert>
              )}
              {infoQuery.data && (
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {infoQuery.data.app?.name ?? 'Banking Statement Converter'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Version:</strong> {infoQuery.data.app?.version ?? infoQuery.data.build?.version ?? '1.0.0'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong>{' '}
                    {infoQuery.data.app?.description ?? 'CAMT/MT format converter via Spring Batch'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Author:</strong> {infoQuery.data.app?.author ?? 'Wallace Espindola'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={600} mb={1.5}>
            Job Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatCard label="Total Jobs" value={jobsQuery.isLoading ? '—' : totalJobs} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                label="Completed"
                value={jobsQuery.isLoading ? '—' : completedJobs}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                label="Failed"
                value={jobsQuery.isLoading ? '—' : failedJobs}
                color="error.main"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={600} mb={1.5}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {QUICK_ACTIONS.map((action) => (
              <Grid item xs={12} sm={6} md={4} key={action.label}>
                {action.internal ? (
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(action.path)}
                      sx={{ height: '100%', p: 1 }}
                    >
                      <CardContent>
                        <Box mb={1}>{action.icon}</Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {action.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {action.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ) : (
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                    }}
                  >
                    <CardActionArea
                      component="a"
                      href={action.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ height: '100%', p: 1 }}
                    >
                      <CardContent>
                        <Box mb={1}>{action.icon}</Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {action.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {action.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                )}
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* CTA Buttons */}
        <Grid item xs={12}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/generate')}
              size="large"
            >
              Generate Statements
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate('/convert')}
              size="large"
            >
              Run Conversion
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
