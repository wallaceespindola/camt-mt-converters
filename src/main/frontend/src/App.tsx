import { useState, useMemo } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Link,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import HistoryIcon from '@mui/icons-material/History'
import BarChartIcon from '@mui/icons-material/BarChart'
import SpeedIcon from '@mui/icons-material/Speed'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

import DashboardView from './views/DashboardView'
import DataGeneratorView from './views/DataGeneratorView'
import ConversionRunnerView from './views/ConversionRunnerView'
import ConversionHistoryView from './views/ConversionHistoryView'
import ConversionChartsView from './views/ConversionChartsView'
import BenchmarkDashboardView from './views/BenchmarkDashboardView'
import DiagramsView from './views/DiagramsView'

const DRAWER_WIDTH = 230

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Generate Statements', path: '/generate', icon: <AddCircleOutlineIcon /> },
  { label: 'Conversion Runner', path: '/convert', icon: <PlayArrowIcon /> },
  { label: 'History', path: '/history', icon: <HistoryIcon /> },
  { label: 'Charts', path: '/charts', icon: <BarChartIcon /> },
  { label: 'Benchmark', path: '/benchmark', icon: <SpeedIcon /> },
  { label: 'Diagrams', path: '/diagrams', icon: <AccountTreeIcon /> },
]

function SideNav({ mode }: { mode: 'light' | 'dark' }) {
  const location = useLocation()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
          borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        },
      }}
    >
      <List disablePadding>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.path}
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider sx={{ mt: 2 }} />
    </Drawer>
  )
}

function AppShell({
  mode,
  onToggleMode,
}: {
  mode: 'light' | 'dark'
  onToggleMode: () => void
}) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #E64A19 0%, #BF360C 100%)',
        }}
      >
        <Toolbar>
          <AccountBalanceIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 0.5 }}
          >
            Banking Statement Converter
          </Typography>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={onToggleMode} size="small">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, mt: '64px' }}>
        <SideNav mode={mode} />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            ml: `${DRAWER_WIDTH}px`,
            minHeight: 'calc(100vh - 64px - 52px)',
            bgcolor: mode === 'dark' ? 'grey.900' : 'grey.50',
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/generate" element={<DataGeneratorView />} />
            <Route path="/convert" element={<ConversionRunnerView />} />
            <Route path="/history" element={<ConversionHistoryView />} />
            <Route path="/charts" element={<ConversionChartsView />} />
            <Route path="/benchmark" element={<BenchmarkDashboardView />} />
            <Route path="/diagrams" element={<DiagramsView />} />
          </Routes>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          ml: `${DRAWER_WIDTH}px`,
          py: 1.5,
          px: 3,
          bgcolor: mode === 'dark' ? 'grey.900' : 'grey.100',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          By{' '}
          <Link
            href="https://www.linkedin.com/in/wallaceespindola/"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            underline="hover"
          >
            Wallace Espindola
          </Link>{' '}
          &nbsp;•&nbsp; Banking Statement Converter v1.0.0 &nbsp;•&nbsp; Spring Batch + CAMT/MT Formats
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Tooltip title="GitHub">
            <IconButton
              size="small"
              component="a"
              href="https://github.com/wallaceespindola/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="LinkedIn">
            <IconButton
              size="small"
              component="a"
              href="https://www.linkedin.com/in/wallaceespindola/"
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
            >
              <LinkedInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#E64A19' },
          secondary: { main: '#FF9800' },
          ...(mode === 'dark' && {
            background: { default: '#121212', paper: '#1E1E1E' },
          }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode],
  )

  const handleToggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppShell mode={mode} onToggleMode={handleToggleMode} />
      </BrowserRouter>
    </ThemeProvider>
  )
}
