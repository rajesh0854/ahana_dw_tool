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
  InputLabel
} from '@mui/material';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import { 
  Visibility as VisibilityIcon, 
  Code as CodeIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  AccountTree as TreeIcon,
  ViewList as ListIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
  FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import JobDetailsDialog from './JobDetailsDialog';
import ScheduleConfiguration from './ScheduleConfiguration';
import JobDependencyTree from './JobDependencyTree';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';

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

const ActionButton = styled(IconButton)(({ theme, darkMode }) => ({
  backgroundColor: darkMode ? 'rgba(66, 153, 225, 0.1)' : 'rgba(66, 153, 225, 0.05)',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)',
  },
  marginRight: theme.spacing(0.75),
  padding: 6,
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
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLogicDialog, setOpenLogicDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // New state for view mode: 'tree' or 'list'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState({});
  const [tableTypeFilter, setTableTypeFilter] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('');
  
  // New state for dependency saving
  const [dependencySaving, setDependencySaving] = useState({});
  
  const contentRef = useRef(null);
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();

  // Check scroll position to show/hide scroll-to-top button
  const handleScroll = () => {
    if (contentRef.current) {
      const scrollTop = contentRef.current.scrollTop;
      setShowScrollTop(scrollTop > 300);
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
          FRQCD: '',
          FRQDD: '',
          FRQHH: '',
          FRQMI: '',
          STRTDT: null,
          ENDDT: null,
          DPND_JOBSCHID: job.DPND_JOBSCHID?.toString() || '',
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
        
        // Create a date object from the date string if it exists
        let startDate = null;
        let endDate = null;
        
        if (scheduleDetails.STRTDT) {
          startDate = new Date(scheduleDetails.STRTDT);
        }
        
        if (scheduleDetails.ENDDT) {
          endDate = new Date(scheduleDetails.ENDDT);
        }
        
        // Handle dependent job ID (ensure it's a string)
        let dependentJobId = '';
        if (scheduleDetails.DPND_JOBSCHID !== null && scheduleDetails.DPND_JOBSCHID !== undefined && scheduleDetails.DPND_JOBSCHID !== '') {
          dependentJobId = String(scheduleDetails.DPND_JOBSCHID);
        }
        
        // Ensure we have string values for all select fields
        const frqcd = String(scheduleDetails.FRQCD || '');
        const frqdd = String(scheduleDetails.FRQDD || '');
        const frqhh = String(scheduleDetails.FRQHH || '');
        const frqmi = String(scheduleDetails.FRQMI || '');
        
        console.log('Parsed schedule details:', {
          FRQCD: frqcd,
          FRQDD: frqdd,
          FRQHH: frqhh,
          FRQMI: frqmi,
          STRTDT: startDate,
          ENDDT: endDate,
          DPND_JOBSCHID: dependentJobId
        });
        
        // Update the schedule data with fetched values
        setScheduleData(prev => ({
          ...prev,
          [jobId]: {
            ...prev[jobId],
            JOBFLWID: jobId,
            MAPREF: scheduleDetails.MAPREF || job.MAPREF || '',
            FRQCD: frqcd,
            FRQDD: frqdd,
            FRQHH: frqhh,
            FRQMI: frqmi,
            STRTDT: startDate,
            ENDDT: endDate,
            DPND_JOBSCHID: dependentJobId,
            STFLG: scheduleDetails.STFLG || '',
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

  // Handle view logic
  const handleViewLogic = (job) => {
    setSelectedJob(job);
    setOpenLogicDialog(true);
  };

  // Handle close of view logic dialog
  const handleCloseLogicDialog = () => {
    setOpenLogicDialog(false);
  };

  // Handle row expansion
  const toggleRowExpansion = (jobId) => {
    // If this row is already expanded, just close it
    if (expandedRows[jobId]) {
      setExpandedRows(prev => ({
        ...prev,
        [jobId]: false
      }));
      return;
    }
    
    // Close all rows and open only the clicked one
    const newExpandedRows = {};
    Object.keys(expandedRows).forEach(id => {
      newExpandedRows[id] = false;
    });
    newExpandedRows[jobId] = true;
    
    setExpandedRows(newExpandedRows);
    
    // Fetch schedule details for the newly expanded row
    const job = jobs.find(j => j.JOBFLWID === jobId);
    if (job) {
      fetchJobScheduleDetails(jobId);
    }
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
      
      // Format dates for API
      let formattedStartDate = null;
      let formattedEndDate = null;
      
      if (jobData.STRTDT) {
        formattedStartDate = format(jobData.STRTDT, 'yyyy-MM-dd');
      }
      
      if (jobData.ENDDT) {
        formattedEndDate = format(jobData.ENDDT, 'yyyy-MM-dd');
      }
      
      // Remove dependency data for the schedule update
      const requestData = {
        JOBFLWID: jobId,
        MAPREF: jobData.MAPREF,
        FRQCD: jobData.FRQCD,
        FRQDD: jobData.FRQDD,
        FRQHH: jobData.FRQHH,
        FRQMI: jobData.FRQMI,
        STRTDT: formattedStartDate,
        ENDDT: formattedEndDate
        // Removed DPND_JOBSCHID as requested
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
              ? { ...job, JOB_SCHEDULE_STATUS: 'Scheduled' } 
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
  
  // Handle save dependency
  const handleSaveDependency = async (jobId, dependencyData) => {
    try {
      // Set saving state for this specific job's dependency
      setDependencySaving(prev => ({ ...prev, [jobId]: true }));
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/job/save_parent_child_job`, 
        dependencyData
      );
      
      if (response.data.success) {
        setSuccessMessage('Dependency saved successfully');
      } else {
        setError(response.data.message || 'Failed to save dependency');
      }
    } catch (err) {
      console.error('Error saving job dependency:', err);
      setError('Failed to save dependency. Please try again.');
    } finally {
      // Clear saving state for this job's dependency
      setDependencySaving(prev => ({ ...prev, [jobId]: false }));
      
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
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

  // Apply all filters to jobs
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

  // Filter out non-scheduled jobs for dependency tree view
  const scheduledJobs = filteredJobs.filter(job => job.JOB_SCHEDULE_STATUS === 'Scheduled');

  // Table header columns (updated to show JOBSCHID instead of JOBFLWID)
  const columns = [
    { id: 'JOBSCHID', label: 'Job Schedule ID' },
    { id: 'MAPREF', label: 'Mapping Reference' },
    { id: 'TARGET', label: 'Target Table' },
    { id: 'TRGTBTYP', label: 'Table Type' },
    { id: 'STATUS', label: 'Schedule Status' },
    { id: 'actions', label: 'Actions' },
    { id: 'schedule', label: 'Schedule' },
  ];

  const handleRefresh = () => {
    fetchJobs();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
        <Box mb={3}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            color={darkMode ? 'white' : 'text.primary'}
            sx={{ 
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 600,
              letterSpacing: '-0.025em'
            }}
          >
          Jobs Management
        </Typography>
          <Typography 
            variant="body1" 
            color={darkMode ? 'gray.300' : 'text.secondary'} 
            mb={2}
            sx={{ fontSize: '0.9375rem' }}
          >
          View and manage all your data warehouse jobs
        </Typography>
      </Box>

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
        {/* View Toggle Tabs */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'divider', 
          px: 2,
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs 
              value={viewMode} 
              onChange={handleViewModeChange} 
              aria-label="job view mode tabs"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: darkMode ? 'primary.main' : 'primary.main',
                },
                '& .MuiTab-root': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-selected': {
                    color: darkMode ? 'primary.light' : 'primary.main',
                    fontWeight: 600,
                  }
                }
              }}
            >
              <Tab 
                icon={<TreeIcon fontSize="small" />} 
                iconPosition="start" 
                label="Dependency Tree" 
                value="tree" 
              />
              <Tab 
                icon={<ListIcon fontSize="small" />} 
                iconPosition="start" 
                label="List View" 
                value="list" 
              />
            </Tabs>
            
            {/* Filters and Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>

              {/* Refresh button */}
              <Tooltip title="Refresh Jobs">
                <IconButton 
                  onClick={handleRefresh}
                  sx={{ 
                    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    color: darkMode ? '#60A5FA' : '#3B82F6',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              {/* Search field */}
              <TextField
                size="small"
                placeholder="Search jobs..."
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ width: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color={darkMode ? 'primary' : 'inherit'} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(249, 250, 251, 0.9)',
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
                  mr: 1,
                  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                  color: darkMode ? '#60A5FA' : '#3B82F6',
                  borderRadius: 8,
                  px: 1.5,
                  py: 0.3,
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
              
              {/* Table Type Filter */}
              <Box sx={{ 
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(249, 250, 251, 0.9)',
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
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(249, 250, 251, 0.9)',
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
            </Box>
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
            {/* Tree View */}
            {viewMode === 'tree' && (
              <Box sx={{ p: 3 }}>
                <JobDependencyTree 
                  jobs={scheduledJobs}
                  darkMode={darkMode}
                  handleViewDetails={handleViewDetails}
                  handleViewLogic={handleViewLogic}
                />

                {scheduledJobs.length === 0 && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4, 
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(243, 244, 246, 0.6)',
                    borderRadius: 2,
                    mt: 2
                  }}>
                    <Typography variant="body1" color={darkMode ? 'gray.300' : 'gray.600'}>
                      {searchTerm || tableTypeFilter || scheduleStatusFilter ? 
                        "No matching jobs found with current filters" : 
                        "No scheduled jobs found to display"}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* List View */}
            {viewMode === 'list' && (
              <StyledTableContainer darkMode={darkMode}>
                <Table stickyHeader size="small" aria-label="jobs table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.id === 'actions' || column.id === 'schedule' ? 'center' : 'left'}
                        sx={{ 
                          minWidth: column.id === 'actions' ? 90 : 
                                   column.id === 'schedule' ? 70 : 
                                   column.id === 'STATUS' ? 120 :
                                   column.id === 'TRGTBTYP' ? 100 :
                                   column.id === 'MAPREF' ? 140 :
                                   130,
                          px: column.id === 'actions' || column.id === 'schedule' ? 1 : 2,
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
                  {filteredJobs.map((job) => (
                    <React.Fragment key={job.JOBID}>
                      <TableRow hover sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {job.JOBSCHID || 'Not Scheduled'}
                        </TableCell>
                        <TableCell>{job.MAPREF}</TableCell>
                        <TableCell>
                          <Box component="span" sx={{ 
                            fontSize: '0.8125rem',
                            color: darkMode ? 'primary.light' : 'primary.main', 
                            fontFamily: 'monospace', 
                            fontWeight: 500,
                            backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            py: 0.5, 
                            px: 1, 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                          }}>
                            {`${job.TRGSCHM}.${job.TRGTBNM}`}
                          </Box>
                        </TableCell>
                        <TableCell>{job.TRGTBTYP}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Box component="span" sx={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              px: 1.5,
                              py: 0.5,
                              width: 'fit-content',
                              minWidth: '90px',
                              borderRadius: 8,
                              backgroundColor: job.JOB_SCHEDULE_STATUS === 'Scheduled' 
                                ? (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)') 
                                : (darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)'),
                              color: job.JOB_SCHEDULE_STATUS === 'Scheduled' 
                                ? (darkMode ? '#34D399' : '#059669') 
                                : (darkMode ? '#FBBF24' : '#D97706'),
                              border: '1px solid',
                              borderColor: job.JOB_SCHEDULE_STATUS === 'Scheduled' 
                                ? (darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)') 
                                : (darkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'),
                              textAlign: 'center',
                              boxShadow: job.JOB_SCHEDULE_STATUS === 'Scheduled' 
                                ? (darkMode ? '0 1px 3px rgba(16, 185, 129, 0.1)' : 'none')
                                : (darkMode ? '0 1px 3px rgba(245, 158, 11, 0.1)' : 'none'),
                            }}>
                              {job.JOB_SCHEDULE_STATUS === 'Scheduled' ? (
                                <>
                                  <CheckCircleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                  Scheduled
                                </>
                              ) : (
                                <>
                                  <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                  Not Scheduled
                                </>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
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
                        <TableCell align="center">
                          <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                toggleRowExpansion(job.JOBFLWID);
                              }}
                              sx={{ 
                                color: darkMode ? 'primary.light' : 'primary.main',
                                padding: 0.5,
                                backgroundColor: expandedRows[job.JOBFLWID] ? 
                                  (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)') : 
                                  'transparent'
                              }}
                            >
                              {expandedRows[job.JOBFLWID] ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded row with schedule configuration */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expandedRows[job.JOBFLWID]} timeout="auto" unmountOnExit>
                            <ScheduleConfiguration
                              jobId={job.JOBFLWID}
                              scheduleData={scheduleData}
                              handleScheduleChange={handleScheduleChange}
                              handleDateChange={handleDateChange}
                              handleSaveSchedule={handleSaveSchedule}
                              handleSaveDependency={handleSaveDependency}
                              jobOptions={jobs}
                              darkMode={darkMode}
                              scheduleLoading={scheduleLoading}
                              scheduleSaving={scheduleSaving}
                              dependencySaving={dependencySaving}
                            />
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  {filteredJobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
            )}
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
