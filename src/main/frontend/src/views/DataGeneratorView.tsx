import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Chip,
  Grid,
  Paper,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SpeedIcon from '@mui/icons-material/Speed'
import ScheduleIcon from '@mui/icons-material/Schedule'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import StorageIcon from '@mui/icons-material/Storage'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { generateStatements, type LoadProfile, type RandomStatementResponse } from '../api/client'

const LOAD_PROFILES: { profile: LoadProfile; label: string; statements: number; transactions: number; color: 'primary' | 'secondary' }[] = [
  {
    profile: 'LOW',
    label: 'Low Load',
    statements: 1,
    transactions: 10,
    color: 'primary',
  },
  {
    profile: 'HIGH',
    label: 'High Load',
    statements: 10,
    transactions: 100,
    color: 'secondary',
  },
]

function ResultCard({ result }: { result: RandomStatementResponse }) {
  const navigate = useNavigate()

  const handleGoToConvert = () => {
    localStorage.setItem('lastStatementId', String(result.firstStatementId))
    navigate('/convert')
  }

  return (
    <Card
      sx={{
        mt: 3,
        border: '2px solid',
        borderColor: 'success.main',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'success.dark' : 'success.50'),
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={700} color="success.main" mb={2}>
          Statements Generated Successfully
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                textAlign: 'center',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
              }}
            >
              <StorageIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h4" fontWeight={800} color="primary" mt={0.5}>
                {result.firstStatementId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                First Statement ID
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <ReceiptLongIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {result.statementsGenerated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Statements Generated
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <ScheduleIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {result.transactionsGenerated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Transactions Generated
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Timestamp: {new Date(result.timestamp).toLocaleString()}
          </Typography>
        </Box>

        <Box mt={2} display="flex" gap={2} alignItems="center">
          <Chip
            label={`Statement ID ${result.firstStatementId} saved to clipboard`}
            color="success"
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={handleGoToConvert}
          >
            Go to Conversion Runner
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DataGeneratorView() {
  const [lastResult, setLastResult] = useState<RandomStatementResponse | null>(null)
  const [activeProfile, setActiveProfile] = useState<LoadProfile | null>(null)

  const mutation = useMutation({
    mutationFn: (profile: LoadProfile) => generateStatements(profile),
    onSuccess: (data) => {
      setLastResult(data)
      localStorage.setItem('lastStatementId', String(data.firstStatementId))
    },
  })

  const handleGenerate = (profile: LoadProfile) => {
    setActiveProfile(profile)
    mutation.mutate(profile)
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <AddCircleOutlineIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>
          Generate Statement Data
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" mb={3}>
        Generate random bank statements and transactions stored in the H2 in-memory database.
        Use the resulting Statement ID in the Conversion Runner to export to MT940, MT942, CAMT052, or CAMT053 format.
      </Typography>

      {/* Load Profile Cards */}
      <Grid container spacing={3}>
        {LOAD_PROFILES.map(({ profile, label, statements, transactions, color }) => (
          <Grid item xs={12} sm={6} key={profile}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderColor: activeProfile === profile && mutation.isPending ? `${color}.main` : 'divider',
                borderWidth: activeProfile === profile && mutation.isPending ? 2 : 1,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SpeedIcon color={color} />
                  <Typography variant="h6" fontWeight={700}>
                    {label}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1} mb={3}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Statements:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {statements}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Transactions:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {transactions}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Profile:
                    </Typography>
                    <Chip label={profile} size="small" color={color} />
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color={color}
                  fullWidth
                  startIcon={
                    mutation.isPending && activeProfile === profile ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  disabled={mutation.isPending}
                  onClick={() => handleGenerate(profile)}
                  size="large"
                >
                  {mutation.isPending && activeProfile === profile
                    ? 'Generating...'
                    : `Generate ${label}`}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Error State */}
      {mutation.isError && (
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to generate statements:{' '}
          {mutation.error instanceof Error ? mutation.error.message : 'Unknown error'}
        </Alert>
      )}

      {/* Result */}
      {mutation.isSuccess && lastResult && <ResultCard result={lastResult} />}
    </Box>
  )
}
