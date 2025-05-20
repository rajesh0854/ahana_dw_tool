import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

/**
 * Status indicator component that displays job schedule status as an icon
 */
const StatusIndicator = ({ status, darkMode }) => {
  const isScheduled = status === 'Scheduled';
  
  return (
    <Tooltip title={isScheduled ? "Scheduled" : "Not Scheduled"}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: isScheduled 
            ? (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)') 
            : (darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)'),
          color: isScheduled 
            ? (darkMode ? '#34D399' : '#059669') 
            : (darkMode ? '#FBBF24' : '#D97706'),
          border: '1px solid',
          borderColor: isScheduled 
            ? (darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)') 
            : (darkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'),
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        {isScheduled ? (
          <CheckCircleIcon sx={{ fontSize: 20 }} />
        ) : (
          <AccessTimeIcon sx={{ fontSize: 20 }} />
        )}
      </Box>
    </Tooltip>
  );
};

export default StatusIndicator; 