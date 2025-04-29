import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Button,
  Snackbar,
  IconButton,
  Tooltip,
  Breadcrumbs
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  GraphicEq as GraphicEqIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import JobDependencyGraph from './JobDependencyGraph';
import Link from 'next/link';
import JobDetailsDialog from './JobDetailsDialog';
import { ReactFlowProvider } from '@xyflow/react';

const DependencyGraphPage = () => {
  const [jobs, setJobs] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const { darkMode } = useTheme();

  // Fetch all jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Function to fetch all jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/job/get_all_jobs`);
      
      // Filter out only scheduled jobs
      const allJobs = response.data;
      setJobs(allJobs);
      
      const filtered = allJobs.filter(job => job.JOB_SCHEDULE_STATUS === 'Scheduled');
      setScheduledJobs(filtered);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening of job details dialog
  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedJob(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchJobs();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header section */}
      <Box mb={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GraphicEqIcon 
              sx={{ 
                mr: 2, 
                color: darkMode ? 'primary.light' : 'primary.main',
                fontSize: 32
              }} 
            />
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  color: darkMode ? 'white' : 'text.primary',
                }}
              >
                Job Dependency Graph
              </Typography>
              <Breadcrumbs 
                aria-label="breadcrumb" 
                sx={{ 
                  mt: 0.5, 
                  '& .MuiBreadcrumbs-separator': { 
                    mx: 1,
                    color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                  } 
                }}
              >
                <Link 
                  href="/jobs" 
                  passHref
                  style={{
                    textDecoration: 'none', 
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ArrowBackIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                  Jobs List
                </Link>
                <Typography 
                  color={darkMode ? 'primary.light' : 'primary.main'} 
                  sx={{ fontSize: '0.875rem' }}
                >
                  Dependency Graph
                </Typography>
              </Breadcrumbs>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  bgcolor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)',
                  color: darkMode ? 'primary.light' : 'primary.main',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)',
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(243, 244, 246, 0.9)',
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button 
              variant="outlined" 
              component={Link} 
              href="/jobs"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Back to Jobs List
            </Button>
          </Box>
        </Box>
        
        {/* Info box */}
        {/* <Alert 
          severity="info" 
          icon={<InfoIcon fontSize="inherit" />}
          sx={{ 
            mb: 2, 
            backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            color: darkMode ? '#60A5FA' : '#3B82F6',
            borderRadius: '8px',
            '& .MuiAlert-icon': {
              color: darkMode ? '#60A5FA' : '#3B82F6'
            },
            border: '1px solid',
            borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            This graph visualizes dependencies between scheduled jobs. You can zoom, pan, and interact with nodes to see job details.
          </Typography>
        </Alert> */}
      </Box>

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: darkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
            borderLeft: '4px solid',
            borderLeftColor: 'error.main',
            '& .MuiAlert-icon': {
              color: darkMode ? 'error.light' : 'error.main'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Success message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Main content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress color={darkMode ? 'primary' : 'secondary'} />
        </Box>
      ) : (
        <ReactFlowProvider>
          <JobDependencyGraph 
            jobs={scheduledJobs}
            darkMode={darkMode}
            handleViewDetails={handleViewDetails}
          />
        </ReactFlowProvider>
      )}

      {/* Job Details Dialog */}
      <JobDetailsDialog 
        open={openDialog}
        onClose={handleCloseDialog}
        job={selectedJob}
        allJobs={jobs}
      />
    </motion.div>
  );
};

export default DependencyGraphPage; 