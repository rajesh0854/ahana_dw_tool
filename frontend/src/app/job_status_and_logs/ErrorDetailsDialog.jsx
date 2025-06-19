import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  useMediaQuery
} from '@mui/material';
import { styled, alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Key as KeyIcon,
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Format date safely
const formatDate = (dateStr, formatString = 'yyyy-MM-dd HH:mm:ss') => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), formatString);
  } catch (error) {
    console.error(`Error formatting date: ${dateStr}`, error);
    return dateStr || '-';
  }
};

const StyledDialog = styled(Dialog)(({ theme, darkMode }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
    backgroundImage: darkMode 
      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    boxShadow: darkMode 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
      : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(20px)',
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
  },
}));

const ErrorHeader = styled(DialogTitle)(({ theme, darkMode }) => ({
  borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
  background: darkMode 
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(254, 242, 242, 0.8) 0%, rgba(254, 226, 226, 0.9) 100%)',
  color: darkMode ? '#FFFFFF' : theme.palette.error.dark,
  padding: `${theme.spacing(1.5)} ${theme.spacing(3)}`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: darkMode 
      ? 'linear-gradient(90deg, #EF4444, #DC2626, #B91C1C)'
      : 'linear-gradient(90deg, #EF4444, #DC2626, #B91C1C)',
  }
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
  minHeight: '200px'
}));

const ErrorMessagePaper = styled(Paper)(({ theme, darkMode }) => ({
  padding: theme.spacing(2),
  paddingLeft: theme.spacing(2.5),
  background: darkMode 
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
  color: darkMode ? alpha(theme.palette.common.white, 0.95) : theme.palette.common.black,
  border: `1px solid ${darkMode ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.error.main, 0.2)}`,
  borderRadius: '8px',
  fontFamily: '"Monaco", "Consolas", monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: '0.8rem',
  lineHeight: 1.5,
  position: 'relative',
  maxHeight: '25vh',
  minHeight: '120px',
  overflowY: 'auto',
  boxShadow: darkMode 
    ? 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
    : 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '3px',
    height: '100%',
    background: 'linear-gradient(180deg, #EF4444, #DC2626)',
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
  },
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
    borderRadius: '3px',
    '&:hover': {
      background: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    },
  },
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const InfoLabel = styled(Box)(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: '0.75rem',
  fontWeight: 600,
  color: darkMode ? alpha(theme.palette.common.white, 0.8) : alpha(theme.palette.common.black, 0.7),
  marginBottom: theme.spacing(0.5),
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  wordBreak: 'break-word',
  lineHeight: 1.4,
}));

const IconWrapper = styled(Box)(({ theme, darkMode, color }) => ({
  width: 24,
  height: 24,
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: darkMode 
    ? `linear-gradient(135deg, ${alpha(theme.palette[color || 'error'].main, 0.2)}, ${alpha(theme.palette[color || 'error'].dark, 0.3)})`
    : `linear-gradient(135deg, ${alpha(theme.palette[color || 'error'].main, 0.1)}, ${alpha(theme.palette[color || 'error'].light, 0.2)})`,
  color: darkMode 
    ? theme.palette[color || 'error'].light 
    : theme.palette[color || 'error'].main,
  marginRight: theme.spacing(1),
  border: `1px solid ${alpha(theme.palette[color || 'error'].main, 0.3)}`,
  boxShadow: darkMode 
    ? `0 1px 4px ${alpha(theme.palette[color || 'error'].main, 0.2)}`
    : `0 1px 4px ${alpha(theme.palette[color || 'error'].main, 0.1)}`,
  transition: 'all 0.2s ease',
}));

const ErrorDetailsDialog = ({ 
  open, 
  onClose, 
  errorDetails, 
  jobId, 
  loading, 
  darkMode 
}) => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Make sure errorDetails is an array
  const errors = Array.isArray(errorDetails) ? errorDetails : [];
  
  // Filter out any invalid error objects
  const validErrors = errors.filter(error => error && typeof error === 'object');
  
  const handleCopyError = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
  };
  
  const error = validErrors.length > 0 ? validErrors[0] : null;

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      darkMode={darkMode}
      PaperProps={{
        sx: {
          width: '65%', // 30% wider than default md
          maxHeight: '60vh', // 40% less height
        }
      }}
    >
      <ErrorHeader darkMode={darkMode}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <IconWrapper darkMode={darkMode}>
              <ErrorIcon fontSize="small" />
            </IconWrapper>
            <Typography variant="subtitle1" component="span" fontWeight={600}>
              Error Details - {jobId || 'Unknown'}
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{ 
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'rotate(90deg)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </ErrorHeader>
      
      <DialogContent sx={{ 
        p: 2.5,
        pb: 1.5,
        bgcolor: 'transparent',
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.6) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.6) 100%)',
        maxHeight: '45vh',
        overflow: 'auto',
      }}>
        {loading ? (
          <EmptyStateContainer>
            <CircularProgress size={40} sx={{ mb: 2 }} color="error" />
            <Typography variant="subtitle1" color="text.secondary">
              Loading error details...
            </Typography>
          </EmptyStateContainer>
        ) : !error ? (
          <EmptyStateContainer>
            <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No error details found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '450px' }}>
              No specific error information is available for this job.
            </Typography>
          </EmptyStateContainer>
        ) : (
          <Box>
            {/* Error metadata - Horizontal layout for better space usage */}
            <Box display="flex" gap={4} mb={2} flexWrap="wrap">
              <Box flex={1} minWidth="200px">
                <InfoLabel darkMode={darkMode}>
                  <IconWrapper darkMode={darkMode} color="primary"><ScheduleIcon fontSize="small" /></IconWrapper>
                  Process Date
                </InfoLabel>
                <InfoValue>{formatDate(error.PROCESS_DATE)}</InfoValue>
              </Box>
              <Box flex={1} minWidth="200px">
                <InfoLabel darkMode={darkMode}>
                  <IconWrapper darkMode={darkMode} color="primary"><KeyIcon fontSize="small" /></IconWrapper>
                  Job Name
                </InfoLabel>
                <InfoValue>{error.KEY_VALUE || '-'}</InfoValue>
              </Box>
              <Box flex={1} minWidth="150px">
                <InfoLabel darkMode={darkMode}>
                  <IconWrapper darkMode={darkMode} color="info"><InfoIcon fontSize="small" /></IconWrapper>
                  Error Type
                </InfoLabel>
                <InfoValue>{error.ERROR_TYPE || '-'}</InfoValue>
              </Box>
            </Box>
            
            <Divider sx={{ my: 1.5 }} />
            
            {/* Error message section - Optimized for space */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <InfoLabel darkMode={darkMode} sx={{ mb: 0 }}>
                  <IconWrapper darkMode={darkMode} color="error"><CodeIcon fontSize="small" /></IconWrapper>
                  Error Message
                </InfoLabel>
                <Tooltip title="Copy Error Message">
                  <Button 
                    size="small" 
                    startIcon={<ContentCopyIcon fontSize="small" />}
                    onClick={() => handleCopyError(error.ERROR_MESSAGE || '')}
                    variant="outlined"
                    color="primary"
                    sx={{ 
                      fontSize: '0.7rem', 
                      py: 0.5,
                      px: 1.5,
                      minWidth: 'auto',
                      textTransform: 'none',
                      borderRadius: '6px',
                      borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)',
                      color: darkMode ? '#60A5FA' : '#2563EB',
                      '&:hover': { 
                        backgroundColor: darkMode ? alpha(muiTheme.palette.primary.main, 0.1) : alpha(muiTheme.palette.primary.main, 0.05),
                        borderColor: darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.7)',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    Copy
                  </Button>
                </Tooltip>
              </Box>
              <ErrorMessagePaper darkMode={darkMode}>
                {error.ERROR_MESSAGE || 'No error message available'}
              </ErrorMessagePaper>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 1.5,
        pt: 2,
        borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)', 
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
        justifyContent: 'center',
      }}>
        <Button 
          onClick={onClose} 
          color="primary" 
          variant="contained"
          startIcon={<CloseIcon />}
          sx={{
            background: darkMode 
              ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
              : 'linear-gradient(135deg, #3B82F6, #2563EB)',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2.5,
            py: 1,
            boxShadow: darkMode 
              ? '0 4px 12px rgba(59, 130, 246, 0.3)'
              : '0 4px 12px rgba(59, 130, 246, 0.2)',
            '&:hover': {
              background: darkMode 
                ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              transform: 'translateY(-1px)',
              boxShadow: darkMode 
                ? '0 6px 16px rgba(59, 130, 246, 0.4)'
                : '0 6px 16px rgba(59, 130, 246, 0.3)',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
      
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setCopySuccess(false)} 
          severity="success" 
          variant="filled"
          icon={<ContentCopyIcon fontSize="inherit" />}
          sx={{ width: '100%' }}
        >
          Error message copied to clipboard!
        </Alert>
      </Snackbar>
    </StyledDialog>
  );
};

export default ErrorDetailsDialog; 