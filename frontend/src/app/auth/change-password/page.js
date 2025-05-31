'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  Alert,
  CircularProgress,
  Container,
  useTheme,
  Paper,
  Avatar
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import PasswordIcon from '@mui/icons-material/Password';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

// Flower animation component
const FlowerAnimation = () => {
  const [flowers, setFlowers] = useState([]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Generate random position for flowers
  useEffect(() => {
    const flowerCount = 20;
    const newFlowers = [];
    
    for (let i = 0; i < flowerCount; i++) {
      newFlowers.push({
        id: i,
        x: Math.random() * 100, // random x position (%)
        size: Math.random() * 20 + 15, // random size between 15-35px
        delay: Math.random() * 5, // random delay for animation start
        duration: Math.random() * 5 + 10, // random duration between 10-15s
        rotation: Math.random() * 360, // random initial rotation
        color: getRandomColor(isDarkMode),
      });
    }
    
    setFlowers(newFlowers);
  }, [isDarkMode]);
  
  // Get random pastel color for flower
  const getRandomColor = (isDark) => {
    const colors = isDark 
      ? ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb', '#8fd3f4', '#84fab0'] // Brighter for dark mode
      : ['#ffecd2', '#fcb69f', '#fbc2eb', '#a6c1ee', '#d4fc79', '#96e6a1']; // Softer for light mode
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <Box 
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {flowers.map((flower) => (
        <motion.div
          key={flower.id}
          initial={{ 
            y: -100, 
            x: `${flower.x}vw`,
            opacity: 0,
            rotate: flower.rotation,
          }}
          animate={{ 
            y: '100vh',
            opacity: [0, 1, 1, 0.5, 0],
            rotate: flower.rotation + 360,
          }}
          transition={{ 
            duration: flower.duration,
            delay: flower.delay,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
          style={{
            position: 'absolute',
            width: flower.size,
            height: flower.size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: flower.color,
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.1))',
          }}
        >
          <LocalFloristIcon sx={{ fontSize: '100%', transform: 'scale(1.5)' }} />
        </motion.div>
      ))}
    </Box>
  );
};

const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, changePasswordAfterLogin } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Password validation criteria
  const criteria = [
    { id: 'length', label: 'At least 8 characters', valid: newPassword.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { id: 'lowercase', label: 'At least one lowercase letter', valid: /[a-z]/.test(newPassword) },
    { id: 'number', label: 'At least one number', valid: /[0-9]/.test(newPassword) },
    { id: 'special', label: 'At least one special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    { id: 'match', label: 'Passwords match', valid: confirmPassword && newPassword === confirmPassword }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validate password
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await changePasswordAfterLogin(newPassword);
      
      if (result.success) {
        setSuccess(true);
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/home');
        }, 2000);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // For loading state
  if (!user) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Get user's first name if available
  const firstName = user.first_name || user.username?.split(' ')[0] || '';

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' 
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Flower animation */}
      <FlowerAnimation />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            textAlign: 'center', 
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 70,
                  height: 70,
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                  mb: 2,
                  border: '4px solid',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                }}
              >
                <EmojiPeopleIcon sx={{ fontSize: 38 }} />
              </Avatar>
            </motion.div>
            
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: 1,
                background: isDarkMode 
                  ? 'linear-gradient(90deg, #64B5F6, #42A5F5)' 
                  : 'linear-gradient(90deg, #1976d2, #1565c0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.75rem', sm: '2.25rem' },
                letterSpacing: '-0.5px',
              }}
            >
              {`Welcome${firstName ? ', ' + firstName : ''}!`}
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                maxWidth: '450px',
                mx: 'auto',
                fontSize: '1rem',
                lineHeight: 1.5,
                letterSpacing: '0.2px',
              }}
            >
              Please set a new secure password for your account
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper 
            elevation={isDarkMode ? 5 : 2} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              backdropFilter: 'blur(10px)',
              boxShadow: isDarkMode 
                ? '0 10px 30px rgba(0, 0, 0, 0.3)' 
                : '0 10px 30px rgba(0, 0, 0, 0.1)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
            }}
          >
            <Box 
              sx={{ 
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                background: isDarkMode 
                  ? 'linear-gradient(to right, rgba(25, 118, 210, 0.1), transparent)' 
                  : 'linear-gradient(to right, rgba(25, 118, 210, 0.05), transparent)'
              }}
            >
              <LockResetIcon color="primary" sx={{ fontSize: 28, mr: 1.5 }} />
              <Typography variant="h6" fontWeight={600}>
                Create New Password
              </Typography>
            </Box>

            {errors.general && (
              <Alert 
                severity="error" 
                sx={{ 
                  mx: 3, 
                  mt: 3, 
                  borderRadius: 2,
                }}
              >
                {errors.general}
              </Alert>
            )}

            {success && (
              <Alert 
                severity="success" 
                icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                sx={{ 
                  mx: 3, 
                  mt: 3, 
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Password changed successfully! Redirecting...
                </Typography>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
              <TextField
                required
                fullWidth
                size="medium"
                name="newPassword"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                sx={{ 
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PasswordIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                required
                fullWidth
                size="medium"
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ 
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockResetIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password requirements box - more compact */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2.5, 
                  mb: 3, 
                  borderRadius: 2,
                  borderColor: 'divider',
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  fontSize: '0.85rem',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1.5, 
                    fontWeight: 600, 
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  <LockResetIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', color: 'primary.main' }} />
                  Password Requirements
                </Typography>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                  gap: 1.5
                }}>
                  {criteria.map((item) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        py: 0.75,
                        px: 1,
                        borderRadius: 1.5,
                        bgcolor: item.valid 
                          ? (isDarkMode ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)')
                          : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'),
                        transition: 'all 0.2s ease',
                        border: '1px solid',
                        borderColor: item.valid 
                          ? (isDarkMode ? 'rgba(46, 125, 50, 0.3)' : 'rgba(46, 125, 50, 0.2)')
                          : 'transparent',
                      }}
                    >
                      {item.valid ? (
                        <CheckCircleOutlineIcon 
                          sx={{ mr: 1, color: 'success.main', fontSize: '1rem' }} 
                        />
                      ) : (
                        <CancelOutlinedIcon 
                          sx={{ mr: 1, color: isDarkMode ? 'text.disabled' : 'action.disabled', fontSize: '1rem' }} 
                        />
                      )}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: item.valid ? 'success.main' : 'text.secondary',
                          fontWeight: item.valid ? 500 : 400,
                          fontSize: '0.8rem'
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
              
              <motion.div 
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || success}
                  sx={{ 
                    py: 1.25, 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: isDarkMode 
                      ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                      : '0 4px 12px rgba(25, 118, 210, 0.2)',
                    '&:hover': {
                      boxShadow: isDarkMode
                        ? '0 6px 16px rgba(25, 118, 210, 0.4)'
                        : '0 6px 16px rgba(25, 118, 210, 0.3)',
                    },
                    letterSpacing: '0.3px',
                    background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      Updating...
                    </Box>
                  ) : success ? (
                    'Password Changed'
                  ) : (
                    'Set New Password'
                  )}
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ChangePasswordPage;