import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Storage as StorageIcon } from '@mui/icons-material';

/**
 * TargetTableDisplay component displays the target table info
 */
const TargetTableDisplay = ({ targetSchema, targetTable, tableType, darkMode }) => {
  return (
    <Tooltip title={`${targetSchema}.${targetTable} (${tableType || 'Unknown type'})`}>
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.7)',
          py: 0.25, 
          px: 0.75, 
          borderRadius: 1,
          border: '1px solid',
          borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.8)',
          maxWidth: '160px',
          overflow: 'hidden',
          flexShrink: 1,
          minWidth: 0
        }}
      >
        <StorageIcon 
          sx={{ 
            fontSize: 14, 
            color: darkMode ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)',
            opacity: 0.8,
            flexShrink: 0
          }} 
        />
        <Box 
          component="span" 
          sx={{ 
            fontSize: '0.7rem',
            color: darkMode ? 'rgba(156, 163, 175, 0.9)' : 'rgba(107, 114, 128, 0.9)',
            fontFamily: 'monospace', 
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {`${targetSchema}.${targetTable}`}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default TargetTableDisplay; 