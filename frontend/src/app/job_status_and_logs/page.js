"use client";

import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Tooltip,
  IconButton,
  Alert,
  Chip,
  Skeleton,
  Stack,
  Divider,
  Badge,
  LinearProgress,
  useMediaQuery
} from '@mui/material';
import { styled, alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import { 
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import useJobLogs from '@/hooks/useJobLogs';
import LogDetailsDialog from './LogDetailsDialog';
import ErrorDetailsDialog from './ErrorDetailsDialog';

// Styled components
const PageHeader = styled(Box)(({ theme, darkMode }) => ({
  marginBottom: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  lineHeight: 1.2,
  [theme.breakpoints.up('md')]: {
    fontSize: '2rem',
  }
}));

const HeaderSubtitle = styled(Typography)(({ theme, darkMode }) => ({
  fontSize: '0.875rem',
  color: darkMode ? alpha(theme.palette.common.white, 0.7) : alpha(theme.palette.common.black, 0.6),
  maxWidth: '800px',
}));

const StyledTableContainer = styled(TableContainer)(({ theme, darkMode }) => ({
  maxHeight: '70vh',
  borderRadius: theme.shape.borderRadius,
  '& .MuiTableCell-head': {
    backgroundColor: darkMode ? '#1A202C' : '#F7FAFC', 
    color: darkMode ? '#E2E8F0' : '#2D3748',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '12px 16px',
    whiteSpace: 'nowrap',
    borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
  },
  '& .MuiTableCell-body': {
    color: darkMode ? '#E2E8F0' : '#2D3748',
    padding: '8px 16px',
    fontSize: '0.875rem',
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    transition: 'background-color 0.2s ease',
  },
}));

const ActionButton = styled(IconButton)(({ theme, darkMode }) => ({
  backgroundColor: darkMode ? 'rgba(66, 153, 225, 0.1)' : 'rgba(66, 153, 225, 0.05)',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)',
  },
  marginRight: theme.spacing(0.75),
  padding: 6,
  transition: 'all 0.2s ease',
}));

const StatusChip = styled(Chip)(({ theme, status, darkMode }) => {
  let color;
  let backgroundColor;
  
  if (status === 'A') {
    color = darkMode ? '#C6F6D5' : '#22543D';
    backgroundColor = darkMode ? 'rgba(72, 187, 120, 0.2)' : 'rgba(72, 187, 120, 0.1)';
  } else if (status === 'I') {
    color = darkMode ? '#FED7D7' : '#822727';
    backgroundColor = darkMode ? 'rgba(245, 101, 101, 0.2)' : 'rgba(245, 101, 101, 0.1)';
  } else {
    color = darkMode ? '#EDF2F7' : '#4A5568';
    backgroundColor = darkMode ? 'rgba(160, 174, 192, 0.2)' : 'rgba(160, 174, 192, 0.1)';
  }
  
  return {
    color: color,
    backgroundColor: backgroundColor,
    fontWeight: 500,
    fontSize: '0.75rem',
    borderRadius: '4px',
    '& .MuiChip-icon': {
      color: 'inherit',
    },
    transition: 'all 0.2s ease',
    border: `1px solid ${darkMode ? 'transparent' : alpha(color, 0.3)}`,
  };
});

const CardHeader = styled(Box)(({ theme, darkMode }) => ({
  padding: theme.spacing(2),
  borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const RefreshIconButton = styled(IconButton)(({ theme, darkMode }) => ({
  color: darkMode ? theme.palette.primary.light : theme.palette.primary.main,
  backgroundColor: darkMode ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
  '&:hover': {
    backgroundColor: darkMode ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
  },
  transition: 'all 0.2s ease',
}));

const JobStatusAndLogsPage = () => {
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  const {
    scheduledJobs,
    logDetails,
    errorDetails,
    loading,
    logLoading,
    errorLoading,
    error,
    fetchScheduledJobs,
    fetchJobLogs,
    fetchErrorDetails
  } = useJobLogs();
  
  const [selectedMapRef, setSelectedMapRef] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to view job logs
  const handleViewLogs = async (mapReference) => {
    if (!mapReference) {
      console.error('Map reference is undefined or empty');
      return;
    }
    
    setSelectedMapRef(mapReference);
    await fetchJobLogs(mapReference);
    setOpenLogDialog(true);
  };

  // Function to view error details
  const handleViewErrors = async (jobId) => {
    if (!jobId) {
      console.error('Job ID is undefined or empty');
      return;
    }
    
    setSelectedJobId(jobId);
    await fetchErrorDetails(jobId);
    setOpenErrorDialog(true);
  };

  // Function to close log dialog
  const handleCloseLogDialog = () => {
    setOpenLogDialog(false);
  };

  // Function to close error dialog
  const handleCloseErrorDialog = () => {
    setOpenErrorDialog(false);
  };

  // Function to get status label
  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    if (status === 'A') return 'Active';
    if (status === 'I') return 'Inactive';
    return status;
  };

  // Function to get status icon
  const getStatusIcon = (status) => {
    if (!status) return <ErrorIcon fontSize="small" />;
    if (status === 'A') return null;
    if (status === 'I') return <ErrorIcon fontSize="small" />;
    return null;
  };

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchScheduledJobs();
    setIsRefreshing(false);
  };

  // Filter out jobs with invalid data
  const validJobs = scheduledJobs.filter(job => job && job.MAP_REFERENCE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box p={{ xs: 2, sm: 3 }}>
        <PageHeader darkMode={darkMode}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box 
              sx={{ 
                backgroundColor: darkMode ? 'primary.dark' : 'primary.light',
                p: 1,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AssignmentIcon color="primary" fontSize={isMobile ? 'medium' : 'large'} />
            </Box>
            <HeaderTitle variant="h1" color={darkMode ? 'primary.light' : 'primary.main'}>
              Job Status & Logs
            </HeaderTitle>
          </Box>
          <HeaderSubtitle variant="body1" darkMode={darkMode}>
            Track the status of scheduled jobs, view execution logs, and diagnose errors for data warehouse jobs.
          </HeaderSubtitle>
        </PageHeader>
        
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Paper 
          elevation={darkMode ? 2 : 1} 
          sx={{ 
            backgroundColor: darkMode ? '#1A202C' : '#FFFFFF',
            borderRadius: '12px',
            overflow: 'hidden',
            mb: 4,
            boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
          }}
        >
          <CardHeader darkMode={darkMode}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" component="h2" fontWeight={600}>
                Scheduled Jobs
              </Typography>
              <Badge 
                color="primary" 
                badgeContent={validJobs.length} 
                max={99}
                sx={{ ml: 1.5 }}
              />
            </Box>
            <Tooltip title="Refresh data">
              <RefreshIconButton 
                size="small" 
                onClick={handleRefresh} 
                darkMode={darkMode}
                disabled={loading || isRefreshing}
              >
                <RefreshIcon fontSize="small" 
                  sx={{ 
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} 
                />
              </RefreshIconButton>
            </Tooltip>
          </CardHeader>
          
          {(loading || isRefreshing) && (
            <LinearProgress
              sx={{
                height: 3,
                '& .MuiLinearProgress-bar': {
                  transition: 'transform 0.4s linear'
                }
              }}
            />
          )}
          
          {loading ? (
            <Box p={3}>
              <Stack spacing={1.5}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton 
                    key={i} 
                    animation="wave" 
                    height={56} 
                    sx={{ 
                      borderRadius: '8px',
                      opacity: 1 - (i * 0.2),
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }} 
                  />
                ))}
              </Stack>
            </Box>
          ) : validJobs.length === 0 ? (
            <Box 
              p={4} 
              textAlign="center" 
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <InfoIcon 
                  sx={{ 
                    fontSize: 56, 
                    color: 'text.secondary', 
                    opacity: 0.5, 
                    mb: 2,
                    color: darkMode ? 'primary.light' : 'primary.main'
                  }} 
                />
              </motion.div>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                No scheduled jobs found
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                mt={1}
                sx={{ maxWidth: '400px' }}
              >
                Jobs will appear here once they are scheduled in the system. Try creating and scheduling a job first.
              </Typography>
            </Box>
          ) : (
            <StyledTableContainer darkMode={darkMode}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width="60%">Map Reference</TableCell>
                    <TableCell width="20%">Status</TableCell>
                    <TableCell align="center" width="20%">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validJobs.map((job, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                      onClick={() => job.MAP_REFERENCE && handleViewLogs(job.MAP_REFERENCE)}
                      component={motion.tr}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {job.MAP_REFERENCE || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          status={job.STATUS}
                          darkMode={darkMode}
                          label={getStatusLabel(job.STATUS)}
                          size="small"
                          icon={getStatusIcon(job.STATUS)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {job.MAP_REFERENCE ? (
                          <Tooltip title="View Logs">
                            <ActionButton
                              darkMode={darkMode}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewLogs(job.MAP_REFERENCE);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </ActionButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Invalid job data">
                            <span>
                              <ActionButton
                                darkMode={darkMode}
                                disabled
                              >
                                <ErrorIcon fontSize="small" />
                              </ActionButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          )}
        </Paper>

        {/* Log Details Dialog */}
        <LogDetailsDialog
          open={openLogDialog}
          onClose={handleCloseLogDialog}
          mapReference={selectedMapRef}
          logDetails={logDetails}
          loading={logLoading}
          darkMode={darkMode}
          onViewErrors={handleViewErrors}
        />

        {/* Error Details Dialog */}
        <ErrorDetailsDialog
          open={openErrorDialog}
          onClose={handleCloseErrorDialog}
          errorDetails={errorDetails}
          jobId={selectedJobId}
          loading={errorLoading}
          darkMode={darkMode}
        />
      </Box>
    </motion.div>
  );
};

export default JobStatusAndLogsPage;
