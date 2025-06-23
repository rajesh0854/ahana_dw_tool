'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Typography,
  Box,
  Alert,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Button,
  CircularProgress,
} from '@mui/material'
import { styled, ThemeProvider, createTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import ReCAPTCHA from 'react-google-recaptcha'
import { RECAPTCHA_SITE_KEY, ENABLE_RECAPTCHA } from '../../config'
import React from 'react'

const dwTheme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    secondary: {
      main: '#34A853',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    error: {
      main: '#EA4335',
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
})

const LoginContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
})

const LeftPanel = styled(Box)(({ theme }) => ({
  flex: 1.2,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #0d1b2a 100%)`,
  color: theme.palette.common.white,
  padding: '4rem',
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 0.8,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  background: '#f8f9fa',
  [theme.breakpoints.down('md')]: {
    flex: 1,
  },
}))

const FormContainer = styled('form')(({ theme }) => ({
  width: '100%',
  maxWidth: '400px',
  padding: '3rem',
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
}))

const LoginButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: '0.75rem',
  marginTop: '1.5rem',
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'background 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: `0px 7px 20px ${theme.palette.primary.light}55`,
  },
  '&:disabled': {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[500],
  },
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: '1.5rem',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    transition: 'border-color 0.3s ease',
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
}))

const Logo = styled(Box)(({ theme }) => ({
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  fontWeight: 800,
  'span': {
    marginLeft: '0.5rem',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
}))

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const recaptchaRef = useRef(null)
  const router = useRouter()
  const { login } = useAuth()

  const isUsingTestKey =
    RECAPTCHA_SITE_KEY === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  const handleCaptchaChange = (value) => {
    setCaptchaVerified(!!value)
    setRecaptchaToken(value || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    if (ENABLE_RECAPTCHA && RECAPTCHA_SITE_KEY && !captchaVerified) {
      setError('Please verify that you are not a robot')
      return
    }

    setIsLoading(true)
    try {
      const result = await login(
        username,
        password,
        ENABLE_RECAPTCHA && RECAPTCHA_SITE_KEY ? recaptchaToken : undefined
      )
      if (result.success) {
        try {
          const userData = localStorage.getItem('user')
          if (userData) {
            const user = JSON.parse(userData)
            if (user.change_password) {
              router.push('/auth/change-password')
            } else {
              router.push('/home')
            }
          } else {
            router.push('/home')
          }
        } catch (err) {
          console.error('Failed to parse user data:', err)
          router.push('/home')
        }
      } else {
        setError(result.error)
        if (ENABLE_RECAPTCHA && recaptchaRef.current) {
          recaptchaRef.current.reset()
          setCaptchaVerified(false)
          setRecaptchaToken('')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeProvider theme={dwTheme}>
      <LoginContainer>
        <LeftPanel>
          <StorageOutlinedIcon sx={{ fontSize: '5rem', mb: 2 }} />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              marginBottom: 3,
              letterSpacing: '-0.5px',
            }}
          >
            Data Warehouse Tool
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: '80%',
              lineHeight: 1.6,
            }}
          >
            Powerful insights from your data, simplified. Your central hub for
            data management and analytics.
          </Typography>
        </LeftPanel>

        <RightPanel>
          <FormContainer onSubmit={handleSubmit}>
            <Logo>
              <StorageOutlinedIcon
                sx={{
                  fontSize: '2.25rem',
                  color: 'primary.main',
                  marginRight: '0.5rem',
                }}
              />
              DW<span>Tool</span>
            </Logo>

            <Typography
              variant="h5"
              align="center"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: 'text.primary',
              }}
            >
              Sign In to Your Account
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2.5, borderRadius: '0.75rem' }}
              >
                {error}
              </Alert>
            )}

            <StyledTextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <AccountCircleOutlinedIcon
                    sx={{ mr: 1, color: 'action.active' }}
                  />
                ),
              }}
            />

            <StyledTextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <LockOutlinedIcon sx={{ mr: 1, color: 'action.active' }} />
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                href="/auth/forgot-password"
                style={{
                  color: dwTheme.palette.primary.main,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            {ENABLE_RECAPTCHA && (
              <Box
                sx={{
                  mb: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {RECAPTCHA_SITE_KEY ? (
                  <>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={handleCaptchaChange}
                      theme="light"
                    />
                    {isUsingTestKey && (
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{ mt: 1 }}
                      >
                        Using test reCAPTCHA key (for development only)
                      </Typography>
                    )}
                  </>
                ) : (
                  <Alert
                    severity="warning"
                    sx={{ width: '100%', borderRadius: '0.75rem' }}
                  >
                    ReCAPTCHA site key is missing. Please configure it.
                  </Alert>
                )}
              </Box>
            )}

            <LoginButton
              type="submit"
              variant="contained"
              disabled={
                isLoading ||
                (ENABLE_RECAPTCHA && RECAPTCHA_SITE_KEY && !captchaVerified)
              }
            >
              {isLoading ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{ color: 'white', marginRight: 1.5 }}
                  />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </LoginButton>
          </FormContainer>
        </RightPanel>
      </LoginContainer>
    </ThemeProvider>
  )
}

export default LoginPage
