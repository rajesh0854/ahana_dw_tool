import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

/**
 * MappingDetails component displays mapping reference
 */
const MappingDetails = ({ mapRef, darkMode }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      width: '100%'
    }}>
      {/* Mapping Reference */}
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600,
          fontSize: '0.875rem',
          color: darkMode ? 'white' : 'text.primary',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0
        }}
      >
        {mapRef}
      </Typography>
    </Box>
  );
};

export default MappingDetails; 