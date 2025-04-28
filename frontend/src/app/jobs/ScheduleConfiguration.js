import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  Autocomplete,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CalendarMonth as CalendarIcon,
  Save as SaveIcon,
  Update as UpdateIcon,
  Link as LinkIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Styled components
const CompactSelect = styled(Select)(({ theme, darkMode }) => ({
  '& .MuiSelect-select': {
    padding: '4px 6px',
    fontSize: '0.75rem',
  },
  minWidth: 80
}));

const CompactTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    padding: '4px 6px',
    fontSize: '0.75rem'
  }
}));

const CompactFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    fontSize: '0.75rem',
    transform: 'translate(8px, 7px) scale(1)'
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)'
  }
}));

const StyledChip = styled(Chip)(({ theme, darkMode, status }) => ({
  height: '20px',
  fontSize: '0.675rem',
  fontWeight: 600,
  borderRadius: '4px',
  padding: '0 2px',
  backgroundColor: status === 'Scheduled' 
    ? (darkMode ? theme.palette.success.dark : theme.palette.success.light) 
    : (darkMode ? theme.palette.grey[700] : theme.palette.grey[200]),
  color: status === 'Scheduled'
    ? (darkMode ? theme.palette.success.contrastText : theme.palette.success.dark)
    : (darkMode ? theme.palette.grey[100] : theme.palette.grey[800]),
  '.MuiChip-label': {
    padding: '0 6px'
  }
}));

const CompactButton = styled(Button)(({ theme, darkMode }) => ({
  height: '32px',
  fontSize: '0.75rem',
  padding: '4px 10px',
  minWidth: 'unset',
  borderRadius: '6px',
  whiteSpace: 'nowrap',
  boxShadow: 'none',
  textTransform: 'none',
  fontWeight: 600,
  '&.Mui-disabled': {
    opacity: 0.6
  }
}));

const ScheduleConfiguration = ({ 
  jobId, 
  scheduleData, 
  handleScheduleChange, 
  handleDateChange, 
  handleSaveSchedule,
  handleSaveDependency,
  jobOptions,
  darkMode,
  scheduleLoading,
  scheduleSaving,
  dependencySaving
}) => {
  // State for validation errors
  const [dateError, setDateError] = useState(null);
  
  // For debugging
  console.log(`ScheduleConfiguration for job ${jobId}:`, {
    scheduleData: scheduleData[jobId],
    job: jobOptions.find(j => j.JOBFLWID === jobId)
  });

  // Frequency code options
  const frequencyCodes = [
    { value: 'ID', label: 'Intraday (ID)' },
    { value: 'DL', label: 'Daily (DL)' },
    { value: 'WK', label: 'Weekly (WK)' },
    { value: 'FN', label: 'Fortnightly (FN)' },
    { value: 'MN', label: 'Monthly (MN)' },
    { value: 'HY', label: 'Half-yearly (HY)' },
    { value: 'YR', label: 'Yearly (YR)' },
    // Handle possible value coming from database
    { value: 'WKL', label: 'Weekly (WKL)' },
  ];

  // Generate day options based on frequency
  const getDayOptions = (freqCode) => {
    if (freqCode === 'WK') {
      return [
        { value: 'MON', label: 'Monday (MON)' },
        { value: 'TUE', label: 'Tuesday (TUE)' },
        { value: 'WED', label: 'Wednesday (WED)' },
        { value: 'THU', label: 'Thursday (THU)' },
        { value: 'FRI', label: 'Friday (FRI)' },
        { value: 'SAT', label: 'Saturday (SAT)' },
        { value: 'SUN', label: 'Sunday (SUN)' },
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
  const getHourOptions = (freqCode) => {
    const hours = [];
    
    if (freqCode === 'ID') {
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

  // Validate date ranges whenever start or end date changes
  useEffect(() => {
    const startDate = scheduleData[jobId]?.STRTDT;
    const endDate = scheduleData[jobId]?.ENDDT;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        setDateError('End date cannot be earlier than start date');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [scheduleData, jobId]);

  // Find the current job to check if it's scheduled
  const job = jobOptions.find(j => j.JOBFLWID === jobId);
  const isScheduled = job?.JOB_SCHEDULE_STATUS === 'Scheduled';
  const isLoading = scheduleLoading?.[jobId] === true;
  const isSaving = scheduleSaving?.[jobId] === true;
  const isDependencySaving = dependencySaving?.[jobId] === true;

  // Determine if form has changes compared to initial data
  const hasRequiredScheduleFields = scheduleData[jobId]?.FRQCD && 
                           scheduleData[jobId]?.FRQDD && 
                           scheduleData[jobId]?.FRQHH && 
                           scheduleData[jobId]?.FRQMI && 
                           scheduleData[jobId]?.STRTDT &&
                           !dateError;
                           
  const hasDependencyData = scheduleData[jobId]?.DPND_JOBSCHID;

  // Handler for saving dependency only
  const handleSaveDependencyClick = () => {
    if (!hasDependencyData) return;
    
    const parentJob = jobOptions.find(j => j.JOBFLWID.toString() === scheduleData[jobId]?.DPND_JOBSCHID);
    if (parentJob) {
      const dependencyData = {
        PARENT_MAP_REFERENCE: parentJob.MAPREF,
        CHILD_MAP_REFERENCE: job.MAPREF
      };
      
      handleSaveDependency(jobId, dependencyData);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.75,
        mx: 0.5, 
        my: 0.75,
        backgroundColor: darkMode ? 'rgba(17, 25, 40, 0.7)' : 'rgba(249, 250, 251, 0.9)',
        borderRadius: 2,
        border: '1px solid',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: darkMode ? 
          '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 
          '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        transition: 'all 0.15s ease-in-out',
        '&:hover': {
          boxShadow: darkMode ? 
            '0 6px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 
            '0 6px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        },
        width: '100%'
      }}
    >
      {/* Header with status and job info */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box component="span" sx={{ 
            width: 3, 
            height: 22, 
            backgroundColor: isScheduled ? 
              (darkMode ? 'success.main' : 'success.main') : 
              (darkMode ? 'primary.main' : 'primary.main'),
            mr: 1.5, 
            borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}></Box>
          <Typography 
            variant="subtitle2" 
            fontWeight="600" 
            sx={{ 
              fontSize: '0.875rem',
              color: darkMode ? 'primary.light' : 'primary.dark',
            }}
          >
            {job?.MAPREF || scheduleData[jobId]?.MAPREF || jobId}
          </Typography>
          <StyledChip 
            size="small" 
            label={isScheduled ? "Scheduled" : "Not Scheduled"} 
            status={isScheduled ? "Scheduled" : "Not Scheduled"}
            darkMode={darkMode}
            sx={{ ml: 1.5 }}
          />
        </Box>
        
        {/* Loading or saving indicator */}
        {(isLoading || isSaving || isDependencySaving) && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={14} sx={{ mr: 1 }} color={isSaving || isDependencySaving ? "success" : "primary"} />
            <Typography variant="caption" sx={{ color: darkMode ? 'gray.400' : 'gray.600', fontSize: '0.7rem' }}>
              {isLoading ? 'Loading...' : isSaving ? 'Saving schedule...' : 'Saving dependency...'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Error message */}
      {dateError && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon fontSize="small" />} 
          sx={{ 
            mb: 1.5, 
            py: 0,
            px: 1,
            fontSize: '0.75rem',
            '& .MuiAlert-icon': { fontSize: '0.875rem', mr: 1 }
          }}
        >
          {dateError}
        </Alert>
      )}
      
      {/* All fields in a single row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          flexWrap: 'nowrap',
          gap: { xs: 0.75, md: 1 },
          opacity: isLoading || isSaving || isDependencySaving ? 0.7 : 1,
          pointerEvents: isLoading || isSaving || isDependencySaving ? 'none' : 'auto',
          width: '100%'
        }}
      >
        {/* Frequency */}
        <Box sx={{ width: '8%', minWidth: '65px' }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.75rem' }}>Frequency</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQCD || ''}
              onChange={(e) => {
                handleScheduleChange(jobId, 'FRQCD', e.target.value);
              }}
              label="Frequency"
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select</MenuItem>
              {frequencyCodes.map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Day */}
        <Box sx={{ width: '7%', minWidth: '55px' }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.75rem' }}>Day</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQDD || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQDD', e.target.value)}
              label="Day"
              disabled={!scheduleData[jobId]?.FRQCD}
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select</MenuItem>
              {getDayOptions(scheduleData[jobId]?.FRQCD).map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Hour */}
        <Box sx={{ width: '6%', minWidth: '45px' }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.75rem' }}>Hour</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQHH || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQHH', e.target.value)}
              label="Hour"
              disabled={!scheduleData[jobId]?.FRQCD}
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select</MenuItem>
              {getHourOptions(scheduleData[jobId]?.FRQCD).map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Minute */}
        <Box sx={{ width: '6%', minWidth: '45px' }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.75rem' }}>Minute</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQMI || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQMI', e.target.value)}
              label="Minute"
              disabled={!scheduleData[jobId]?.FRQCD}
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select</MenuItem>
              {getMinuteOptions().map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Start Date */}
        <Box sx={{ width: '13%', minWidth: '105px' }}>
          <DatePicker
            label="Start Date"
            value={scheduleData[jobId]?.STRTDT}
            onChange={(date) => handleDateChange(jobId, 'STRTDT', date)}
            slots={{
              openPickerIcon: () => <CalendarIcon fontSize="small" sx={{ fontSize: '0.875rem' }} />
            }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: dateError && scheduleData[jobId]?.STRTDT !== null,
                InputLabelProps: {
                  sx: { fontSize: '0.75rem' }
                },
                sx: { 
                  '& .MuiInputBase-input': { 
                    fontSize: '0.75rem',
                    padding: '6px 8px'
                  }
                }
              },
              popper: {
                sx: { zIndex: 9999 }
              }
            }}
          />
        </Box>
        
        {/* End Date */}
        <Box sx={{ width: '13%', minWidth: '105px' }}>
          <DatePicker
            label="End Date"
            value={scheduleData[jobId]?.ENDDT}
            onChange={(date) => handleDateChange(jobId, 'ENDDT', date)}
            minDate={scheduleData[jobId]?.STRTDT ? new Date(scheduleData[jobId]?.STRTDT) : null}
            slots={{
              openPickerIcon: () => <CalendarIcon fontSize="small" sx={{ fontSize: '0.875rem' }} />
            }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: !!dateError,
                InputLabelProps: {
                  sx: { fontSize: '0.75rem' }
                },
                sx: { 
                  '& .MuiInputBase-input': { 
                    fontSize: '0.75rem',
                    padding: '6px 8px'
                  }
                }
              },
              popper: {
                sx: { zIndex: 9999 }
              }
            }}
          />
        </Box>
        
        {/* Save Schedule Button */}
        <Box sx={{ width: '7%', minWidth: '75px' }}>
          <CompactButton
            variant="contained"
            color="primary"
            startIcon={isSaving ? (
              <CircularProgress size={14} color="inherit" />
            ) : isScheduled ? (
              <UpdateIcon sx={{ fontSize: 14 }} />
            ) : (
              <SaveIcon sx={{ fontSize: 14 }} />
            )}
            size="small"
            onClick={() => handleSaveSchedule(jobId)}
            disabled={
              !hasRequiredScheduleFields ||
              isLoading ||
              isSaving
            }
            darkMode={darkMode}
            fullWidth
          >
            {isSaving ? 'Saving...' : isScheduled ? 'Update' : 'Save'}
          </CompactButton>
        </Box>
        
        {/* Divider */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        {/* Dependency section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: '240px' }}>
          <Box sx={{ flexGrow: 1, minWidth: '150px' }}>
            <Autocomplete
              size="small"
              options={jobOptions.filter(j => j.JOBFLWID !== jobId)}
              getOptionLabel={(option) => option.MAPREF}
              isOptionEqualToValue={(option, value) => 
                option.JOBFLWID.toString() === value.JOBFLWID.toString()
              }
              value={jobOptions.find(j => j.JOBFLWID.toString() === scheduleData[jobId]?.DPND_JOBSCHID) || null}
              onChange={(event, newValue) => {
                handleScheduleChange(jobId, 'DPND_JOBSCHID', newValue ? newValue.JOBFLWID.toString() : '');
              }}
              disabled={!isScheduled}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.75rem'
                },
                '& .MuiOutlinedInput-root': {
                  padding: '1px 4px 1px 8px'
                },
                '& .MuiOutlinedInput-input': {
                  padding: '6px 4px 6px 4px'
                },
                '& .MuiAutocomplete-endAdornment': {
                  top: 'calc(50% - 10px)'
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Job"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontSize: '0.75rem' }
                  }}
                />
              )}
            />
          </Box>
          
          <CompactButton
            variant="outlined"
            color="secondary"
            startIcon={isDependencySaving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <LinkIcon sx={{ fontSize: 14 }} />
            )}
            size="small"
            onClick={handleSaveDependencyClick}
            disabled={
              !hasDependencyData ||
              !isScheduled ||
              isLoading ||
              isDependencySaving
            }
            darkMode={darkMode}
          >
            {isDependencySaving ? 'Saving...' : 'Link'}
          </CompactButton>
          
          <Tooltip title="This job will run after the selected parent job completes">
            <InfoIcon 
              sx={{ 
                fontSize: '0.875rem', 
                color: darkMode ? 'grey.500' : 'grey.600', 
                cursor: 'help',
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }} 
            />
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default ScheduleConfiguration; 