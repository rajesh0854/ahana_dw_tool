'use client'

import { useState } from 'react'
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
} from '@mui/material'
import { motion } from 'framer-motion'
import { styled } from '@mui/material/styles'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import {
  LockOutlined,
  AccountCircleOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// Create a light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
})

// Main container for the login page
const LoginContainer = styled(Box)`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

// Left panel with background image and overlay
const LeftPanel = styled(Box)`
  flex: 1;
  background-image: url('/data-visualization.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(32, 101, 176, 0.8) 0%,
      rgba(13, 71, 161, 0.9) 100%
    );
    z-index: 1;
  }

  @media (max-width: 960px) {
    display: none;
  }
`

// Right panel containing the login form
const RightPanel = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);

  @media (max-width: 960px) {
    flex: none;
    width: 100%;
  }
`

// Form container - smaller size and improved styling
const FormContainer = styled(Box)`
  width: 100%;
  max-width: 380px;
  padding: 2.5rem;
  border-radius: 1.25rem;
  background-color: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.18);
  }
`

// Custom styled button with improved animation
const LoginButton = styled('button')`
  width: 100%;
  padding: 0.875rem;
  margin-top: 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(90deg, #2065b0 0%, #0d47a1 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(13, 71, 161, 0.3);
  }

  &:active {
    transform: translateY(-1px);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
  }

  &:hover::after {
    animation: shine 1.5s infinite;
  }

  @keyframes shine {
    100% {
      transform: translateX(100%);
    }
  }
`

// Improved styled text field
const StyledTextField = styled(TextField)`
  margin-bottom: 1.25rem;

  .MuiOutlinedInput-root {
    border-radius: 0.75rem;
    transition: all 0.3s ease;
    font-size: 0.95rem;

    &.Mui-focused {
      .MuiOutlinedInput-notchedOutline {
        border-color: #2065b0;
        border-width: 2px;
      }
    }

    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: #2065b0;
    }
  }

  .MuiInputLabel-root {
    font-size: 0.95rem;

    &.Mui-focused {
      color: #2065b0;
    }
  }

  .MuiInputAdornment-root {
    color: #adb5bd;
  }
`

// Enhanced Logo
const Logo = styled(motion.div)`
  margin-bottom: 1.5rem;
  font-size: 2.25rem;
  font-weight: 700;
  color: #2065b0;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    display: inline-block;
    margin-left: 0.5rem;
    background: linear-gradient(90deg, #2065b0, #0d47a1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

// Login page component
const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    setIsLoading(true)
    try {
      const result = await login(username, password)
      if (result.success) {
        router.push('/home')
      } else {
        setError(result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 20 },
    },
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <LoginContainer>
        {/* Left panel with background and messaging */}
        <LeftPanel>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              zIndex: 2,
              maxWidth: '80%',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                marginBottom: 4,
                textShadow: '0 2px 15px rgba(0, 0, 0, 0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              Welcome to DW Tool
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 400,
                marginBottom: 6,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                maxWidth: '80%',
                mx: 'auto',
                lineHeight: 1.5,
              }}
            >
              Your complete solution for data management and mapping
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                    padding: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    width: '180px',
                    height: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    100+
                  </Typography>
                  <Typography variant="body1">Data Connectors</Typography>
                </Box>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.05 }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                    padding: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    width: '180px',
                    height: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Fast
                  </Typography>
                  <Typography variant="body1">Data Mapping</Typography>
                </Box>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                    padding: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    width: '180px',
                    height: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Secure
                  </Typography>
                  <Typography variant="body1">Enterprise Ready</Typography>
                </Box>
              </motion.div>
            </Box>
          </motion.div>
        </LeftPanel>

        {/* Right panel with login form */}
        <RightPanel>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%', maxWidth: '380px' }}
          >
            <FormContainer
              as={motion.form}
              onSubmit={handleSubmit}
              variants={itemVariants}
            >
              <Logo
                initial={{ scale: 0, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2,
                }}
              >
                DW<span>Tool</span>
              </Logo>

              <motion.div variants={itemVariants}>
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    background: 'linear-gradient(90deg, #2065b0, #0d47a1)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.5px',
                  }}
                >
                  Sign In to Your Account
                </Typography>
              </motion.div>

              {error && (
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    severity="error"
                    sx={{ mb: 3, borderRadius: '0.75rem' }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <StyledTextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <AccountCircleOutlined sx={{ mr: 1, color: '#2065b0' }} />
                    ),
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
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
                      <LockOutlined sx={{ mr: 1, color: '#2065b0' }} />
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
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                style={{
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
                      sx={{
                        color: '#adb5bd',
                        '&.Mui-checked': { color: '#2065b0' },
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Remember me</Typography>}
                />
                <Link
                  href="/auth/forgot-password"
                  style={{
                    color: '#2065b0',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#0d47a1',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot Password?
                </Link>
              </motion.div>

              <motion.div variants={itemVariants}>
                <LoginButton
                  type="submit"
                  as={motion.button}
                  whileHover={{ scale: isLoading ? 1 : 1.03 }}
                  whileTap={{ scale: isLoading ? 1 : 0.97 }}
                  disabled={isLoading}
                  sx={{
                    opacity: isLoading ? 0.7 : 1,
                    position: 'relative',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          border: '3px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '50%',
                          borderTopColor: 'white',
                          animation: 'spin 1s linear infinite',
                          marginRight: '8px',
                          verticalAlign: 'middle',
                        }}
                      />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </LoginButton>
              </motion.div>
            </FormContainer>
          </motion.div>
        </RightPanel>
      </LoginContainer>
    </ThemeProvider>
  )
}

export default LoginPage
