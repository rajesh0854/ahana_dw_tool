import React from 'react';
import { 
  Typography, 
  Box, 
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CalendarMonth as CalendarIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Styled components
const CompactSelect = styled(Select)(({ theme, darkMode }) => ({
  '& .MuiSelect-select': {
    padding: '6px 8px',
    fontSize: '0.8125rem',
  },
  minWidth: 90
}));

const CompactTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    padding: '6px 8px',
    fontSize: '0.8125rem'
  }
}));

const CompactFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    fontSize: '0.8125rem',
    transform: 'translate(8px, 8px) scale(1)'
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)'
  }
}));

const ScheduleConfiguration = ({ 
  jobId, 
  scheduleData, 
  handleScheduleChange, 
  handleDateChange, 
  handleSaveSchedule,
  jobOptions,
  darkMode 
}) => {
  // Frequency code options
  const frequencyCodes = [
    { value: 'ID', label: 'Intraday (ID)' },
    { value: 'DL', label: 'Daily (DL)' },
    { value: 'WK', label: 'Weekly (WK)' },
    { value: 'FN', label: 'Fortnightly (FN)' },
    { value: 'MN', label: 'Monthly (MN)' },
    { value: 'HY', label: 'Half-yearly (HY)' },
    { value: 'YR', label: 'Yearly (YR)' },
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

  return (
    <Box sx={{ 
      py: 2.5, 
      px: 3, 
      backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(243, 244, 246, 0.7)',
      borderRadius: 2,
      borderBottom: '1px solid',
      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderTop: '1px solid',
      borderTopColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      boxShadow: darkMode ? 'inset 0 1px 5px rgba(0, 0, 0, 0.2)' : 'inset 0 1px 5px rgba(0, 0, 0, 0.05)',
    }}>
      <Typography 
        variant="subtitle2" 
        gutterBottom 
        fontWeight="600" 
        sx={{ 
          mb: 2,
          color: darkMode ? 'primary.light' : 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.9rem',
          letterSpacing: '0.01em',
        }}
      >
        <Box component="span" sx={{ 
          width: 4, 
          height: 18, 
          backgroundColor: darkMode ? 'primary.main' : 'primary.main', 
          mr: 1.5, 
          borderRadius: 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}></Box>
        Schedule Configuration for {jobId}
      </Typography>
      
      {/* Single row layout */}
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'flex-end' },
          gap: 2,
          flexWrap: 'nowrap',
          width: '100%'
        }}
      >
        {/* Frequency - 12% */}
        <Box sx={{ width: { xs: '100%', md: '12%' } }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.8125rem' }}>Frequency</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQCD || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQCD', e.target.value)}
              label="Frequency"
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Select</MenuItem>
              {frequencyCodes.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Day - 12% */}
        <Box sx={{ width: { xs: '100%', md: '12%' } }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.8125rem' }}>Day</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQDD || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQDD', e.target.value)}
              label="Day"
              disabled={!scheduleData[jobId]?.FRQCD}
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Select</MenuItem>
              {getDayOptions(scheduleData[jobId]?.FRQCD).map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Hour - 8% */}
        <Box sx={{ width: { xs: '100%', md: '8%' } }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.8125rem' }}>Hour</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQHH || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQHH', e.target.value)}
              label="Hour"
              disabled={!scheduleData[jobId]?.FRQCD}
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Select</MenuItem>
              {getHourOptions(scheduleData[jobId]?.FRQCD).map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Minute - 8% */}
        <Box sx={{ width: { xs: '100%', md: '8%' } }}>
          <CompactFormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.8125rem' }}>Minute</InputLabel>
            <CompactSelect
              value={scheduleData[jobId]?.FRQMI || ''}
              onChange={(e) => handleScheduleChange(jobId, 'FRQMI', e.target.value)}
              label="Minute"
              disabled={!scheduleData[jobId]?.FRQCD}
              darkMode={darkMode}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Select</MenuItem>
              {getMinuteOptions().map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CompactSelect>
          </CompactFormControl>
        </Box>
        
        {/* Start Date - 17% */}
        <Box sx={{ width: { xs: '100%', md: '17%' } }}>
          <DatePicker
            label="Start Date"
            value={scheduleData[jobId]?.STRTDT}
            onChange={(date) => handleDateChange(jobId, 'STRTDT', date)}
            slots={{
              openPickerIcon: () => <CalendarIcon fontSize="small" />
            }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: { 
                  '& .MuiInputBase-input': { 
                    fontSize: '0.8125rem',
                    padding: '8px 10px'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.8125rem'
                  }
                }
              },
              popper: {
                sx: { zIndex: 9999 }
              }
            }}
          />
        </Box>
        
        {/* End Date - 17% */}
        <Box sx={{ width: { xs: '100%', md: '17%' } }}>
          <DatePicker
            label="End Date"
            value={scheduleData[jobId]?.ENDDT}
            onChange={(date) => handleDateChange(jobId, 'ENDDT', date)}
            slots={{
              openPickerIcon: () => <CalendarIcon fontSize="small" />
            }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: { 
                  '& .MuiInputBase-input': { 
                    fontSize: '0.8125rem',
                    padding: '8px 10px'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.8125rem'
                  }
                }
              },
              popper: {
                sx: { zIndex: 9999 }
              }
            }}
          />
        </Box>
        
        {/* Dependent Job - 16% */}
        <Box sx={{ width: { xs: '100%', md: '16%' } }}>
          <Autocomplete
            size="small"
            options={jobOptions.filter(j => j.JOBFLWID !== jobId)}
            getOptionLabel={(option) => option.JOBFLWID}
            value={jobOptions.find(j => j.JOBFLWID === scheduleData[jobId]?.DPND_JOBSCHID) || null}
            onChange={(event, newValue) => {
              handleScheduleChange(jobId, 'DPND_JOBSCHID', newValue ? newValue.JOBFLWID : '');
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.8125rem'
              },
              '& .MuiOutlinedInput-root': {
                padding: '1px 9px 1px 8px'
              },
              '& .MuiOutlinedInput-input': {
                padding: '7.5px 4px 7.5px 4px'
              },
              '& .MuiAutocomplete-endAdornment': {
                top: 'calc(50% - 12px)'
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Dependent Job"
                fullWidth
                InputLabelProps={{
                  sx: { fontSize: '0.8125rem' }
                }}
              />
            )}
          />
        </Box>
        
        {/* Save Button - 10% */}
        <Box sx={{ 
          width: { xs: '100%', md: '10%' },
          display: 'flex',
          justifyContent: { xs: 'flex-end', md: 'center' },
          alignItems: 'center',
          mt: { xs: 1, md: 0 },
          mb: { xs: 0.5, md: 0.5 }
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
            size="small"
            onClick={() => handleSaveSchedule(jobId)}
            disabled={
              !scheduleData[jobId]?.FRQCD ||
              !scheduleData[jobId]?.FRQDD ||
              !scheduleData[jobId]?.FRQHH ||
              !scheduleData[jobId]?.FRQMI ||
              !scheduleData[jobId]?.STRTDT
            }
            sx={{ 
              borderRadius: 1.5,
              py: 0.75,
              px: 1.5,
              height: '36px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              boxShadow: darkMode ? 
                '0 2px 10px rgba(59, 130, 246, 0.3)' : 
                '0 2px 10px rgba(59, 130, 246, 0.2)',
              '&:hover': {
                boxShadow: darkMode ? 
                  '0 3px 12px rgba(59, 130, 246, 0.4)' : 
                  '0 3px 12px rgba(59, 130, 246, 0.3)',
              }
            }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ScheduleConfiguration; 