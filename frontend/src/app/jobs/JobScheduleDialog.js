"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Autocomplete,
  Fade
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Close, Schedule, Save, Add, CalendarMonth, AccessTime, Update } from '@mui/icons-material';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const JobScheduleDialog = ({ open, onClose, job, availableJobs }) => {
  const { darkMode } = useTheme();
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    FRQCD: '',
    FRQDD: '',
    FRQHH: '',
    FRQMI: '',
    STRTDT: null,
    ENDDT: null,
    DPND_JOBSCHID: '',
  });

  // Frequency code options
  const frequencyCodes = [
    { value: 'ID', label: 'Intraday' },
    { value: 'DL', label: 'Daily' },
    { value: 'WK', label: 'Weekly' },
    { value: 'FN', label: 'Fortnightly' },
    { value: 'MN', label: 'Monthly' },
    { value: 'HY', label: 'Half-yearly' },
    { value: 'YR', label: 'Yearly' },
  ];

  // Generate day options based on frequency
  const getDayOptions = () => {
    if (formData.FRQCD === 'WK') {
      return [
        { value: 'MON', label: 'Monday' },
        { value: 'TUE', label: 'Tuesday' },
        { value: 'WED', label: 'Wednesday' },
        { value: 'THU', label: 'Thursday' },
        { value: 'FRI', label: 'Friday' },
        { value: 'SAT', label: 'Saturday' },
        { value: 'SUN', label: 'Sunday' },
      ];
    } else {
      const days = [];
      for (let i = 1; i <= 31; i++) {
        days.push({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') });
      }
      return days;
    }
  };

  // Generate hour options
  const getHourOptions = () => {
    const hours = [];
    
    if (formData.FRQCD === 'ID') {
      hours.push({ value: '-1', label: '-1 (Intraday)' });
    }
    
    for (let i = 0; i <= 23; i++) {
      hours.push({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') });
    }
    return hours;
  };

  // Generate minute options
  const getMinuteOptions = () => {
    const minutes = [];
    for (let i = 0; i <= 59; i++) {
      minutes.push({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') });
    }
    return minutes;
  };

  // Fetch job schedule details
  useEffect(() => {
    if (open && job) {
      fetchJobSchedule();
    }
  }, [open, job]);

  const fetchJobSchedule = async () => {
    if (!job?.JOBFLWID) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/job/get_job_schedule_details/${job.JOBFLWID}`);
      
      if (response.data && !response.data.error) {
        setScheduleData(response.data);
        
        // If we have schedule data, populate the form
        if (response.data.FRQCD) {
          setFormData({
            FRQCD: response.data.FRQCD || '',
            FRQDD: response.data.FRQDD || '',
            FRQHH: response.data.FRQHH || '',
            FRQMI: response.data.FRQMI || '',
            STRTDT: response.data.STRTDT ? parseISO(response.data.STRTDT) : null,
            ENDDT: response.data.ENDDT ? parseISO(response.data.ENDDT) : null,
            DPND_JOBSCHID: response.data.DPND_JOBSCHID || '',
          });
        }
      } else {
        // Initialize empty form if no schedule exists
        setFormData({
          FRQCD: '',
          FRQDD: '',
          FRQHH: '',
          FRQMI: '',
          STRTDT: null,
          ENDDT: null,
          DPND_JOBSCHID: '',
        });
        setScheduleData(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching job schedule:', err);
      setError('Failed to fetch job schedule details. Please try again later.');
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Format dates for submission
      const formattedData = {
        ...formData,
        JOBFLWID: job.JOBFLWID,
        STRTDT: formData.STRTDT ? format(formData.STRTDT, 'yyyy-MM-dd') : null,
        ENDDT: formData.ENDDT ? format(formData.ENDDT, 'yyyy-MM-dd') : null,
      };
      
      // Simulate API call
      // In a real app, you would send this data to your backend
      // const response = await axios.post('http://localhost:5000/job/create_update_job_schedule', formattedData);
      
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Job schedule successfully saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving job schedule:', err);
      setError('Failed to save job schedule. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onClose();
        }
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: darkMode ? 'white' : 'inherit',
          borderRadius: 2,
          maxHeight: '90vh',
          backdropFilter: 'blur(10px)',
          background: darkMode ? 
            'linear-gradient(to bottom right, rgba(17, 24, 39, 0.98), rgba(30, 41, 59, 0.98))' : 
            'linear-gradient(to bottom right, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.98))',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: darkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          px: 3,
          py: 2,
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Schedule sx={{ mr: 1.5, color: darkMode ? 'primary.main' : 'secondary.main' }} />
          <Typography variant="h5" fontWeight="500">
            Job Schedule Configuration
          </Typography>
        </Box>
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          sx={{
            color: darkMode ? 'gray.400' : 'gray.600',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2, overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress color={darkMode ? 'primary' : 'secondary'} />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Fade in={!!success}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              </Fade>
            )}
            
            {/* Job Info Section */}
            <Paper
              elevation={darkMode ? 2 : 1}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ width: 3, height: 24, backgroundColor: darkMode ? 'primary.main' : 'secondary.main', mr: 1.5, borderRadius: 1 }}></Box>
                Job Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Flow ID"
                    value={job?.JOBFLWID || ''}
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mapper Reference"
                    value={job?.MAPREF || ''}
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
            
            {/* Schedule Metadata Section */}
            <Paper
              elevation={darkMode ? 2 : 1}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ width: 3, height: 24, backgroundColor: darkMode ? 'primary.main' : 'secondary.main', mr: 1.5, borderRadius: 1 }}></Box>
                Schedule Metadata
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}>Created Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}>Updated Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{scheduleData?.RECCRDT || '-'}</TableCell>
                      <TableCell>{scheduleData?.RECUPDT || '-'}</TableCell>
                      <TableCell>
                        {scheduleData?.STFLG === 'A' ? (
                          <Box component="span" sx={{ 
                            py: 0.5, 
                            px: 1.5, 
                            borderRadius: 1, 
                            backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                            color: darkMode ? 'rgb(16, 185, 129)' : 'rgb(6, 95, 70)',
                            fontWeight: 'medium',
                            fontSize: '0.75rem'
                          }}>
                            Active
                          </Box>
                        ) : scheduleData?.STFLG === 'N' ? (
                          <Box component="span" sx={{ 
                            py: 0.5, 
                            px: 1.5, 
                            borderRadius: 1, 
                            backgroundColor: darkMode ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.1)',
                            color: darkMode ? 'rgb(244, 63, 94)' : 'rgb(159, 18, 57)',
                            fontWeight: 'medium',
                            fontSize: '0.75rem'
                          }}>
                            Inactive
                          </Box>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            {/* Schedule Configuration Section */}
            <Paper
              elevation={darkMode ? 2 : 1}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ width: 3, height: 24, backgroundColor: darkMode ? 'primary.main' : 'secondary.main', mr: 1.5, borderRadius: 1 }}></Box>
                Schedule Configuration
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="frequency-code-label">Frequency Code *</InputLabel>
                    <Select
                      labelId="frequency-code-label"
                      id="frequency-code"
                      name="FRQCD"
                      value={formData.FRQCD}
                      onChange={handleChange}
                      label="Frequency Code *"
                      required
                      sx={{
                        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <MenuItem value="" disabled>Select Frequency</MenuItem>
                      {frequencyCodes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label} ({option.value})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" disabled={!formData.FRQCD}>
                    <InputLabel id="frequency-day-label">Frequency Day *</InputLabel>
                    <Select
                      labelId="frequency-day-label"
                      id="frequency-day"
                      name="FRQDD"
                      value={formData.FRQDD}
                      onChange={handleChange}
                      label="Frequency Day *"
                      required
                      sx={{
                        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <MenuItem value="" disabled>Select Day</MenuItem>
                      {getDayOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="frequency-hour-label">Hour *</InputLabel>
                    <Select
                      labelId="frequency-hour-label"
                      id="frequency-hour"
                      name="FRQHH"
                      value={formData.FRQHH}
                      onChange={handleChange}
                      label="Hour *"
                      required
                      startAdornment={<AccessTime sx={{ color: 'action.active', mr: 1, ml: -0.5 }} />}
                      sx={{
                        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <MenuItem value="" disabled>Select Hour</MenuItem>
                      {getHourOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="frequency-minute-label">Minute *</InputLabel>
                    <Select
                      labelId="frequency-minute-label"
                      id="frequency-minute"
                      name="FRQMI"
                      value={formData.FRQMI}
                      onChange={handleChange}
                      label="Minute *"
                      required
                      sx={{
                        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <MenuItem value="" disabled>Select Minute</MenuItem>
                      {getMinuteOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date *"
                      value={formData.STRTDT}
                      onChange={(date) => handleDateChange('STRTDT', date)}
                      renderInput={(params) => 
                        <TextField 
                          {...params} 
                          fullWidth 
                          required
                          sx={{
                            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 1
                          }}
                        />
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          required: true,
                          InputProps: {
                            startAdornment: <CalendarMonth sx={{ color: 'action.active', mr: 1, ml: -0.5 }} />
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={formData.ENDDT}
                      onChange={(date) => handleDateChange('ENDDT', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          InputProps: {
                            startAdornment: <CalendarMonth sx={{ color: 'action.active', mr: 1, ml: -0.5 }} />
                          },
                          sx: {
                            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 1
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12}>
                  <Autocomplete
                    id="dependent-job"
                    options={availableJobs.filter(j => j.JOBFLWID !== job?.JOBFLWID)}
                    getOptionLabel={(option) => `${option.JOBFLWID} - ${option.MAPREF}`}
                    value={availableJobs.find(j => j.JOBFLWID === formData.DPND_JOBSCHID) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        DPND_JOBSCHID: newValue ? newValue.JOBFLWID : ''
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Dependent Job"
                        variant="outlined"
                        fullWidth
                        helperText="Select a job that must complete before this job runs"
                        sx={{
                          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                          borderRadius: 1
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: darkMode ? 'gray.400' : 'gray.600', mr: 'auto' }}>
                * Required fields
              </Typography>
            </Box>
          </motion.div>
        )}
      </DialogContent>
      
      <DialogActions
        sx={{
          padding: 2,
          borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          justifyContent: 'flex-end',
          gap: 1.5
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color={darkMode ? 'primary' : 'secondary'}
          startIcon={<Close />}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={darkMode ? 'primary' : 'secondary'}
          disabled={loading || !formData.FRQCD || !formData.FRQDD || !formData.FRQHH || !formData.FRQMI || !formData.STRTDT}
          startIcon={scheduleData ? <Update /> : <Save />}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            boxShadow: darkMode ? '0 4px 12px rgba(59, 130, 246, 0.5)' : '0 4px 12px rgba(124, 58, 237, 0.25)',
            '&:hover': {
              boxShadow: darkMode ? '0 6px 16px rgba(59, 130, 246, 0.6)' : '0 6px 16px rgba(124, 58, 237, 0.35)',
            }
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : scheduleData ? 'Update Schedule' : 'Create Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobScheduleDialog; 