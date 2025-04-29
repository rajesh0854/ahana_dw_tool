"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Alert,
  Collapse,
  Snackbar,
  Tabs,
  Tab,
  Fab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import { 
  Visibility as VisibilityIcon, 
  Code as CodeIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  ViewList as ListIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import JobDetailsDialog from './JobDetailsDialog';
import ScheduleConfiguration from './ScheduleConfiguration';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  StatusIndicator, 
  MappingDetails, 
  InlineScheduleConfig,
  TargetTableDisplay,
  ScheduleSummary,
  DependencyDisplay
} from './components';

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme, darkMode }) => ({
  maxHeight: '70vh',
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
  },
}));

// Define ActionButton if it's missing
const ActionButton = styled(IconButton)(({ theme, darkMode, color = 'primary' }) => ({
  padding: '4px',
  marginRight: '4px',
  backgroundColor: darkMode 
    ? (color === 'primary' ? 'rgba(59, 130, 246, 0.1)' : color === 'info' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(99, 102, 241, 0.1)') 
    : (color === 'primary' ? 'rgba(59, 130, 246, 0.05)' : color === 'info' ? 'rgba(6, 182, 212, 0.05)' : 'rgba(99, 102, 241, 0.05)'),
  color: darkMode 
    ? (color === 'primary' ? '#60A5FA' : color === 'info' ? '#06B6D4' : '#818CF8')
    : (color === 'primary' ? '#3B82F6' : color === 'info' ? '#0891B2' : '#6366F1'),
  border: '1px solid',
  borderColor: darkMode
    ? (color === 'primary' ? 'rgba(59, 130, 246, 0.2)' : color === 'info' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)')
    : (color === 'primary' ? 'rgba(59, 130, 246, 0.1)' : color === 'info' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
  '&:hover': {
    backgroundColor: darkMode
      ? (color === 'primary' ? 'rgba(59, 130, 246, 0.2)' : color === 'info' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)')
      : (color === 'primary' ? 'rgba(59, 130, 246, 0.1)' : color === 'info' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
  }
}));

// New styled component for scroll-to-top button
const ScrollToTopButton = styled(Fab)(({ theme, darkMode }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.8)',
  color: '#FFFFFF',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.9)',
  },
  zIndex: 1000,
  boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
}));

const JobsPage = () => {
  const { darkMode } = useTheme();
  const contentRef = useRef(null);

  // State for jobs data
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // State for selected job and dialog
  const [selectedJob, setSelectedJob] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLogicDialog, setOpenLogicDialog] = useState(false);
  
  // State for schedule data
  const [scheduleData, setScheduleData] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState({});
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('');
  
  // State for UI
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  
  const muiTheme = useMuiTheme();

  // Handle scroll events
  const handleScroll = () => {
    if (contentRef.current) {
      setShowScrollTop(contentRef.current.scrollTop > 300);
    }
  };
  
  // Scroll to top function
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Fetch all jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Function to resolve dependency map references after fetching jobs
  useEffect(() => {
    // Only process if we have jobs with DPND_JOBSCHID
    if (jobs.length === 0 || !jobs.some(job => job.DPND_JOBSCHID)) {
      return;
    }
    
    // For each job with a DPND_JOBSCHID, find the corresponding dependent job
    let hasChanges = false;
    const updatedJobs = jobs.map(job => {
      if (job.DPND_JOBSCHID) {
        // Find the job with matching JOBSCHID
        const dependentJob = jobs.find(j => j.JOBSCHID === job.DPND_JOBSCHID);
        
        // If found and DPND_MAPREF is not already set correctly, set it
        if (dependentJob && job.DPND_MAPREF !== dependentJob.MAPREF) {
          hasChanges = true;
          return {
            ...job,
            DPND_MAPREF: dependentJob.MAPREF
          };
        }
      }
      return job;
    });
    
    // Only update if there are changes
    if (hasChanges) {
      setJobs(updatedJobs);
    }
  }, [jobs]);

  // Add scroll event listener
  useEffect(() => {
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => {
        currentRef.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Function to fetch all jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/job/get_all_jobs`);
      
      // Since the response structure has changed, we'll directly use the data as it comes
      setJobs(response.data);
      
      // Initialize schedule data for each job
      const initialScheduleData = {};
      response.data.forEach(job => {
        initialScheduleData[job.JOBFLWID] = {
          JOBFLWID: job.JOBFLWID,
          MAPREF: job.MAPREF || '',
          TIMEPARAM: '',
          STRT_DT: null,
          END_DT: null,
          STFLG: 'A' // Default status is Active
        };
      });
      
      setScheduleData(initialScheduleData);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch job schedule details when row is expanded
  const fetchJobScheduleDetails = async (jobId) => {
    // Only fetch if this is a scheduled job and we haven't loaded data yet
    const job = jobs.find(j => j.JOBFLWID === jobId);
    if (!job) return;
    
    // Set loading state for this specific job
    setScheduleLoading(prev => ({ ...prev, [jobId]: true }));
    
    try {
      console.log(`Fetching schedule details for job ${jobId}`);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/job/get_job_schedule_details/${jobId}`);
      console.log('API Response:', response.data);
      
      // Check if there's schedule data
      if (response.data && response.data.length > 0) {
        const scheduleDetails = response.data[0];
        
        // Extract time parameter from individual fields if they exist
        let timeParam = '';
        if (scheduleDetails.FRQCD) {
          timeParam = scheduleDetails.FRQCD;
          
          if (scheduleDetails.FRQDD) {
            timeParam += `_${scheduleDetails.FRQDD}`;
          }
          
          if (scheduleDetails.FRQHH !== undefined && scheduleDetails.FRQMI !== undefined) {
            timeParam += `_${scheduleDetails.FRQHH}:${scheduleDetails.FRQMI}`;
          }
        }
        
        // Update the schedule data with fetched values
        setScheduleData(prev => ({
          ...prev,
          [jobId]: {
            ...prev[jobId],
            JOBFLWID: jobId,
            MAPREF: scheduleDetails.MAPREF || job.MAPREF || '',
            TIMEPARAM: scheduleDetails.TIMEPARAM || timeParam,
            STRT_DT: scheduleDetails.STRT_DT || scheduleDetails.STRTDT,
            END_DT: scheduleDetails.END_DT || scheduleDetails.ENDDT,
            STFLG: scheduleDetails.STFLG || '',
            JOB_SCHEDULE_STATUS: job.JOB_SCHEDULE_STATUS
          }
        }));
      }
    } catch (err) {
      console.error('Error fetching job schedule details:', err);
      // Don't show error message to avoid cluttering the UI
    } finally {
      setScheduleLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Handle view details dialog
  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setOpenDialog(true);
  };
  
  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedJob(null);
  };
  
  // Handle view logic dialog
  const handleViewLogic = (job) => {
    setSelectedJob(job);
    setOpenLogicDialog(true);
  };
  
  // Handle close logic dialog
  const handleCloseLogicDialog = () => {
    setOpenLogicDialog(false);
    setSelectedJob(null);
  };

  // Handle schedule data change
  const handleScheduleChange = (jobId, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [field]: value
      }
    }));
  };

  // Handle date change for schedule
  const handleDateChange = (jobId, field, date) => {
    setScheduleData(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [field]: date
      }
    }));
  };

  // Handle save schedule
  const handleSaveSchedule = async (jobId) => {
    try {
      // Set saving state for this specific job
      setScheduleSaving(prev => ({ ...prev, [jobId]: true }));
      
      const jobData = scheduleData[jobId];
      
      // Validate the schedule data before sending to backend
      const validationError = validateScheduleData(jobData);
      if (validationError) {
        setError(validationError);
        setScheduleSaving(prev => ({ ...prev, [jobId]: false }));
        return;
      }
      
      // Extract time parameter components for backend format
      const timeParts = jobData.TIMEPARAM ? jobData.TIMEPARAM.split('_') : [];
      const frequencyCode = timeParts[0] || '';
      
      // Get day and time parameters based on frequency type
      let frequencyDay = '', frequencyHour = '', frequencyMinute = '';
      
      if (['WK', 'FN', 'MN', 'HY', 'YR'].includes(frequencyCode)) {
        frequencyDay = timeParts[1] || '';
        const timePieces = timeParts[2] ? timeParts[2].split(':') : [];
        frequencyHour = timePieces[0] || '';
        frequencyMinute = timePieces[1] || '';
      } else {
        const timePieces = timeParts[1] ? timeParts[1].split(':') : [];
        frequencyHour = timePieces[0] || '';
        frequencyMinute = timePieces[1] || '';
      }
      
      // Prepare the request data - using the parameter names expected by backend
      const requestData = {
        JOBFLWID: jobId,
        MAPREF: jobData.MAPREF,
        FRQCD: frequencyCode,
        FRQDD: frequencyDay,
        FRQHH: frequencyHour,
        FRQMI: frequencyMinute,
        STRTDT: jobData.STRT_DT,
        ENDDT: jobData.END_DT
      };
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/job/save_job_schedule`, 
        requestData
      );
      
      if (response.data.success) {
        setSuccessMessage('Schedule saved successfully');
        
        // Update the job status to Scheduled in the jobs list
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.JOBFLWID === jobId 
              ? { 
                  ...job, 
                  JOB_SCHEDULE_STATUS: 'Scheduled',
                  // Add the frequency components to the job object for ScheduleSummary display
                  "Frequency code": frequencyCode,
                  "Frequency day": frequencyDay,
                  "frequency hour": frequencyHour,
                  "frequency month": frequencyMinute,
                  "start date": jobData.STRT_DT,
                  "end date": jobData.END_DT,
                  JOBSCHID: response.data.job_schedule_id
                } 
              : job
          )
        );
      } else {
        setError(response.data.message || 'Failed to save schedule');
      }
    } catch (err) {
      console.error('Error saving job schedule:', err);
      setError('Failed to save schedule. Please try again.');
    } finally {
      // Clear saving state for this job
      setScheduleSaving(prev => ({ ...prev, [jobId]: false }));
      
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  // Validate schedule data based on backend requirements
  const validateScheduleData = (jobData) => {
    // Extract time parameter components
    const timeParts = jobData.TIMEPARAM ? jobData.TIMEPARAM.split('_') : [];
    const frequencyCode = timeParts[0] || '';
    
    // Get day and time parameters based on frequency type
    let frequencyDay, frequencyHour, frequencyMinute;
    
    if (['WK', 'FN', 'MN', 'HY', 'YR'].includes(frequencyCode)) {
      frequencyDay = timeParts[1] || '';
      const timePieces = timeParts[2] ? timeParts[2].split(':') : [];
      frequencyHour = timePieces[0] || '';
      frequencyMinute = timePieces[1] || '';
    } else {
      const timePieces = timeParts[1] ? timeParts[1].split(':') : [];
      frequencyHour = timePieces[0] || '';
      frequencyMinute = timePieces[1] || '';
    }
    
    // Validate mapping reference
    if (!jobData.MAPREF) {
      return 'Mapping reference must be provided.';
    }
    
    // Validate frequency code
    if (!frequencyCode || !['ID', 'DL', 'WK', 'FN', 'MN', 'HY', 'YR'].includes(frequencyCode)) {
      return 'Invalid frequency code (Valid: ID,DL,WK,FN,MN,HY,YR).';
    }
    
    // Validate day format for weekly/fortnightly frequency
    if (['WK', 'FN'].includes(frequencyCode)) {
      const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      if (!frequencyDay || !validDays.includes(frequencyDay)) {
        return 'Invalid Frequency Day. For Weekly/Fortlightly frequency, frequency day can be any one of "MON,TUE,WED,THU,FRI,SAT,SUN".';
      }
    }
    
    // Validate day format for monthly/half-yearly/yearly frequency
    if (['MN', 'HY', 'YR'].includes(frequencyCode)) {
      const day = parseInt(frequencyDay, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        return 'Invalid frequency day (Valid: 1 .. 31).';
      }
    }
    
    // Validate hour format (0-23)
    const hour = parseInt(frequencyHour, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return 'Invalid frequency hour (valid: 0 .. 23).';
    }
    
    // Validate minute format (0-59)
    const minute = parseInt(frequencyMinute, 10);
    if (isNaN(minute) || minute < 0 || minute > 59) {
      return 'Invalid frequency minute (valid: 0 .. 59).';
    }
    
    // Validate start date is provided
    if (!jobData.STRT_DT) {
      return 'Schedule start date must be provided.';
    }
    
    // Validate end date is after start date (if provided)
    if (jobData.END_DT) {
      const startDate = new Date(jobData.STRT_DT);
      const endDate = new Date(jobData.END_DT);
      if (startDate >= endDate) {
        return 'Schedule start date must be before schedule end date.';
      }
    }
    
    return null; // No validation errors
  };

  // Handle view mode change
  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  // Handle search filter
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle table type filter
  const handleTableTypeFilterChange = (event) => {
    setTableTypeFilter(event.target.value);
  };
  
  // Handle schedule status filter
  const handleScheduleStatusFilterChange = (event) => {
    setScheduleStatusFilter(event.target.value);
  };

  // Add function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setTableTypeFilter('');
    setScheduleStatusFilter('');
  };

  // Filter apply to jobs
  const filteredJobs = jobs.filter(job => {
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (job.JOBSCHID && job.JOBSCHID.toString().includes(searchLower)) ||
        (job.TRGSCHM && job.TRGSCHM.toLowerCase().includes(searchLower)) ||
        (job.TRGTBNM && job.TRGTBNM.toLowerCase().includes(searchLower)) ||
        (job.MAPREF && job.MAPREF.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;
    }
    
    // Apply table type filter
    if (tableTypeFilter && job.TRGTBTYP !== tableTypeFilter) {
      return false;
    }
    
    // Apply schedule status filter
    if (scheduleStatusFilter) {
      if (scheduleStatusFilter === 'Scheduled' && job.JOB_SCHEDULE_STATUS !== 'Scheduled') {
        return false;
      }
      if (scheduleStatusFilter === 'Not Scheduled' && job.JOB_SCHEDULE_STATUS === 'Scheduled') {
        return false;
      }
    }
    
    return true;
  });
  
  // Get unique table types for filter dropdown
  const tableTypes = [...new Set(jobs.map(job => job.TRGTBTYP))].filter(Boolean).sort();

  // Define columns for table
  const columns = [
    { id: 'MAPREF', label: 'Job Mapping Reference', width: '18%' },
    { id: 'TRGTBNM', label: 'Target Table', width: '16%' },
    { id: 'TRGTBTYP', label: 'Type', width: '6%' },
    { id: 'STATUS', label: 'Status', width: '6%' },
    { id: 'SCHEDULE', label: 'Schedule Configuration', width: '16%' },
    { id: 'SUMMARY', label: 'Schedule Summary', width: '16%' },
    { id: 'DEPENDENCY', label: 'Dependency', width: '12%' },
    { id: 'actions', label: 'View Details', width: '10%' },
  ];

  const handleRefresh = () => {
    fetchJobs();
  };

  // Function to handle dependency updates
  const handleDependencyUpdated = (jobId, dependencyMapRef) => {
    // Find the job with this map reference to get its JOBSCHID
    const dependentJob = jobs.find(j => j.MAPREF === dependencyMapRef);
    
    // Update jobs list with the dependency info
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.JOBFLWID === jobId 
          ? { 
              ...job, 
              DPND_MAPREF: dependencyMapRef,
              DPND_JOBSCHID: dependentJob?.JOBSCHID || null
            } 
          : job
      )
    );
    
    // Show success message
    setSuccessMessage('Dependency saved successfully');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
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

      <Paper 
        elevation={darkMode ? 2 : 1} 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          backgroundColor: darkMode ? '#1E293B' : 'white',
          border: darkMode ? '1px solid #2D3748' : 'none',
          backgroundImage: darkMode ? 
            'linear-gradient(to bottom, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))' : 
            'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.95))',
          boxShadow: darkMode ? 
            '0 4px 20px rgba(0, 0, 0, 0.3)' : 
            '0 4px 20px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1
        }}
      >
        {/* Filter controls with better spacing */}
        <Box sx={{ 
          px: 3,
          py: 2,
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(249, 250, 251, 0.7)',
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: 2
        }}>
          {/* Left side controls - Search and Active Filters */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexGrow: 1,
            flexBasis: { xs: '100%', md: '60%' },
            order: { xs: 2, md: 1 },
            mt: { xs: 2, md: 0 }
          }}>
            {/* Search field */}
            <TextField
              size="small"
              placeholder="Search jobs..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ 
                width: { xs: '100%', sm: 240 },
                flexGrow: { xs: 1, sm: 0 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color={darkMode ? 'primary' : 'inherit'} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'primary.main' : 'primary.main',
                  },
                  fontSize: '0.875rem',
                }
              }}
            />
            
            {/* Active Filter Badge */}
            {(tableTypeFilter || scheduleStatusFilter || searchTerm) && (
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                color: darkMode ? '#60A5FA' : '#3B82F6',
                borderRadius: 8,
                px: 1.5,
                py: 0.3,
                height: 38,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
                }
              }}
              onClick={clearAllFilters}
              >
                <FilterListIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                {(tableTypeFilter ? 1 : 0) + (scheduleStatusFilter ? 1 : 0) + (searchTerm ? 1 : 0)} 
                {' Filter' + ((tableTypeFilter && scheduleStatusFilter) || 
                            (tableTypeFilter && searchTerm) || 
                            (scheduleStatusFilter && searchTerm) ? 's' : '')} 
                Active (Clear)
              </Box>
            )}
          </Box>
          
          {/* Right side controls - Filters and Refresh */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            gap: 2,
            flexBasis: { xs: '100%', md: '40%' },
            order: { xs: 1, md: 2 }
          }}>
            {/* Table Type Filter */}
            <Box sx={{ 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              minWidth: 140,
              height: '38px'
            }}>
              <Select
                value={tableTypeFilter}
                onChange={handleTableTypeFilterChange}
                displayEmpty
                variant="standard"
                sx={{ 
                  fontSize: '0.875rem',
                  '& .MuiSelect-select': {
                    pl: 2,
                    pr: 4,
                    py: 1,
                    backgroundColor: 'transparent',
                  },
                  '&:before, &:after': {
                    display: 'none'
                  },
                  '& .MuiSelect-icon': {
                    right: 8
                  },
                  width: '100%'
                }}
                MenuProps={{ 
                  PaperProps: { 
                    sx: { 
                      maxHeight: 300,
                      mt: 0.5
                    } 
                  } 
                }}
              >
                <MenuItem value=""><em>Table Type: All ({jobs.length})</em></MenuItem>
                {tableTypes.map(type => {
                  const count = jobs.filter(job => job.TRGTBTYP === type).length;
                  return (
                    <MenuItem key={type} value={type}>
                      {type} ({count})
                    </MenuItem>
                  );
                })}
              </Select>
            </Box>
            
            {/* Schedule Status Filter */}
            <Box sx={{ 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              minWidth: 160,
              height: '38px'
            }}>
              <Select
                value={scheduleStatusFilter}
                onChange={handleScheduleStatusFilterChange}
                displayEmpty
                variant="standard"
                sx={{ 
                  fontSize: '0.875rem',
                  '& .MuiSelect-select': {
                    pl: 2,
                    pr: 4,
                    py: 1,
                    backgroundColor: 'transparent',
                  },
                  '&:before, &:after': {
                    display: 'none'
                  },
                  '& .MuiSelect-icon': {
                    right: 8
                  },
                  width: '100%'
                }}
                MenuProps={{ 
                  PaperProps: { 
                    sx: { 
                      maxHeight: 300,
                      mt: 0.5
                    } 
                  } 
                }}
              >
                <MenuItem value=""><em>Status: All ({jobs.length})</em></MenuItem>
                <MenuItem value="Scheduled">
                  Scheduled ({jobs.filter(job => job.JOB_SCHEDULE_STATUS === 'Scheduled').length})
                </MenuItem>
                <MenuItem value="Not Scheduled">
                  Not Scheduled ({jobs.filter(job => job.JOB_SCHEDULE_STATUS !== 'Scheduled').length})
                </MenuItem>
              </Select>
            </Box>
            
            {/* Refresh button */}
            <Tooltip title="Refresh Jobs">
              <IconButton 
                onClick={handleRefresh}
                sx={{ 
                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: darkMode ? '#60A5FA' : '#3B82F6',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  },
                  height: '38px',
                  width: '38px'
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress color={darkMode ? 'primary' : 'secondary'} />
          </Box>
        ) : (
          <Box
            ref={contentRef}
            sx={{ 
              overflow: 'auto', 
              flexGrow: 1,
              maxHeight: 'calc(100vh - 250px)',
              position: 'relative',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(243, 244, 246, 0.5)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.7)' : 'rgba(59, 130, 246, 0.5)',
                }
              }
            }}
          >
            <StyledTableContainer darkMode={darkMode}>
              <Table stickyHeader size="small" aria-label="jobs table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.id === 'actions' || column.id === 'STATUS' ? 'center' : 'left'}
                        sx={{ 
                          width: column.width,
                          px: column.id === 'actions' ? 1 : 2,
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          whiteSpace: 'nowrap',
                          backgroundColor: darkMode ? '#1A202C' : '#F7FAFC'
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs.map((job) => {
                    return (
                      <React.Fragment key={job.JOBID}>
                        <TableRow hover>
                          {/* Job Details - Mapping Reference */}
                          <TableCell>
                            <MappingDetails
                              mapRef={job.MAPREF}
                              darkMode={darkMode}
                            />
                          </TableCell>

                          {/* Target Table Details */}
                          <TableCell>
                            <TargetTableDisplay
                              targetSchema={job.TRGSCHM}
                              targetTable={job.TRGTBNM}
                              tableType={job.TRGTBTYP}
                              darkMode={darkMode}
                            />
                          </TableCell>

                          {/* Table Type */}
                          <TableCell sx={{ pr: 1 }}>{job.TRGTBTYP}</TableCell>

                          {/* Status - Display as icon */}
                          <TableCell align="center" sx={{ pl: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <StatusIndicator 
                                status={job.JOB_SCHEDULE_STATUS} 
                                darkMode={darkMode} 
                              />
                            </Box>
                          </TableCell>

                          {/* Schedule Configuration */}
                          <TableCell>
                            <InlineScheduleConfig
                              jobId={job.JOBFLWID}
                              scheduleData={scheduleData}
                              handleScheduleChange={handleScheduleChange}
                              handleDateChange={handleDateChange}
                              handleSaveSchedule={handleSaveSchedule}
                              isScheduled={job.JOB_SCHEDULE_STATUS === 'Scheduled'}
                              darkMode={darkMode}
                              scheduleLoading={scheduleLoading}
                              scheduleSaving={scheduleSaving}
                            />
                          </TableCell>
                          
                          {/* Schedule Summary */}
                          <TableCell>
                            <ScheduleSummary
                              scheduleData={scheduleData}
                              jobId={job.JOBFLWID}
                              darkMode={darkMode}
                              job={job}
                            />
                          </TableCell>
                          
                          {/* Dependency */}
                          <TableCell>
                            <DependencyDisplay
                              jobId={job.JOBFLWID}
                              mapRef={job.MAPREF}
                              dependency={job.DPND_MAPREF}
                              darkMode={darkMode}
                              onDependencyUpdated={(dependencyMapRef) => handleDependencyUpdated(job.JOBFLWID, dependencyMapRef)}
                              job={job}
                              allJobs={jobs}
                            />
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Tooltip title="View Details">
                                <ActionButton
                                  size="small"
                                  color="primary"
                                  darkMode={darkMode}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(job);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" sx={{ fontSize: 18 }} />
                                </ActionButton>
                              </Tooltip>

                              <Tooltip title="View SQL Logic">
                                <ActionButton
                                  size="small"
                                  color="info"
                                  darkMode={darkMode}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewLogic(job);
                                  }}
                                >
                                  <CodeIcon fontSize="small" sx={{ fontSize: 18 }} />
                                </ActionButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                  {filteredJobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        {searchTerm || tableTypeFilter || scheduleStatusFilter ? (
                          <Typography variant="body1" color={darkMode ? 'gray.300' : 'gray.600'}>
                            No matching jobs found with current filters
                          </Typography>
                        ) : (
                          <Typography variant="body1" color={darkMode ? 'gray.300' : 'gray.600'}>
                            No jobs found
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </Box>
        )}
        
        {/* Scroll to top button */}
        {showScrollTop && (
          <ScrollToTopButton
            size="small"
            aria-label="scroll to top"
            onClick={scrollToTop}
            darkMode={darkMode}
          >
            <KeyboardArrowUpIcon />
          </ScrollToTopButton>
        )}
      </Paper>

      {/* Job Details Dialog */}
      <JobDetailsDialog 
        open={openDialog}
        onClose={handleCloseDialog}
        job={selectedJob}
        allJobs={jobs}
      />

      {/* Job Logic Dialog */}
      <LogicViewDialog
        open={openLogicDialog}
        onClose={handleCloseLogicDialog}
        job={selectedJob}
      />
    </motion.div>
    </LocalizationProvider>
  );
};

export default JobsPage;

// Logic View Dialog Component
const LogicViewDialog = ({ open, onClose, job }) => {
  const { darkMode } = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: darkMode ? '#1E293B' : 'white',
          backgroundImage: darkMode ? 
            'linear-gradient(to bottom, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))' : 
            'none',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: darkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: darkMode ? '#1A202C' : '#F9FAFB', 
        color: darkMode ? 'white' : '#1A202C',
        borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        px: 3,
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CodeIcon sx={{ mr: 1.5, color: darkMode ? 'primary.main' : 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
        SQL Logic for Job ID: {job?.JOBID}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: darkMode ? 'white' : 'grey.500',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2, p: 3, color: darkMode ? 'white' : 'text.primary' }}>
        <Paper
          elevation={darkMode ? 2 : 1}
          sx={{
            p: 1.5,
            backgroundColor: darkMode ? '#2D3748' : '#F7FAFC',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.07)',
            borderRadius: 1.5,
            maxHeight: '60vh',
            overflow: 'auto'
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: '"Roboto Mono", "Consolas", monospace',
              fontSize: '13px',
              color: darkMode ? '#E2E8F0' : '#2D3748',
              padding: '8px'
            }}
          >
            {job?.DWLOGIC || 'No SQL logic available for this job.'}
          </pre>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ 
        backgroundColor: darkMode ? '#1A202C' : '#F9FAFB',
        borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        px: 3,
        py: 1.5
      }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          size="small"
          sx={{ 
            borderRadius: 1.5,
            py: 0.5,
            px: 2,
            fontSize: '0.8125rem'
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
