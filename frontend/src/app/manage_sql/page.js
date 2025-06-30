'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Save,
  Refresh,
  PlayArrow,
  Edit,
  Close
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Editor from '@monaco-editor/react';

const ManageSQLPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // State management
  const [sqlCodes, setSqlCodes] = useState([]);
  const [selectedSqlCode, setSelectedSqlCode] = useState(null);
  const [sqlContent, setSqlContent] = useState('');
  const [originalSqlContent, setOriginalSqlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingCodes, setFetchingCodes] = useState(false);
  const [fetchingLogic, setFetchingLogic] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Validation state
  const [validationStatus, setValidationStatus] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog states
  const [previewDialog, setPreviewDialog] = useState(false);

  // Fetch all SQL codes on component mount
  useEffect(() => {
    fetchAllSqlCodes();
  }, []);

  // Track changes in SQL content
  useEffect(() => {
    setHasUnsavedChanges(sqlContent !== originalSqlContent && sqlContent.trim() !== '');
    if (sqlContent !== originalSqlContent) {
      setValidationStatus(null);
    }
  }, [sqlContent, originalSqlContent]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch all SQL codes
  const fetchAllSqlCodes = async () => {
    setFetchingCodes(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manage-sql/fetch-all-sql-codes`);
      const result = await response.json();
      
      if (result.success) {
        setSqlCodes(result.data || []);
        showSnackbar(`Successfully loaded ${result.count} SQL codes`, 'success');
      } else {
        showSnackbar(result.message || 'Failed to fetch SQL codes', 'error');
      }
    } catch (error) {
      console.error('Error fetching SQL codes:', error);
      showSnackbar('Network error while fetching SQL codes', 'error');
    } finally {
      setFetchingCodes(false);
    }
  };

  // Fetch SQL logic for selected code
  const fetchSqlLogic = async (sqlCode) => {
    if (!sqlCode) return;
    
    setFetchingLogic(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manage-sql/fetch-sql-logic?sql_code=${encodeURIComponent(sqlCode)}`);
      const result = await response.json();
      
      if (result.success) {
        setSqlContent(result.data.sql_content || '');
        setOriginalSqlContent(result.data.sql_content || '');
        setValidationStatus(null);
        showSnackbar(`Successfully loaded SQL logic for ${sqlCode}`, 'success');
      } else {
        showSnackbar(result.message || 'Failed to fetch SQL logic', 'error');
        setSqlContent('');
        setOriginalSqlContent('');
      }
    } catch (error) {
      console.error('Error fetching SQL logic:', error);
      showSnackbar('Network error while fetching SQL logic', 'error');
      setSqlContent('');
      setOriginalSqlContent('');
    } finally {
      setFetchingLogic(false);
    }
  };

  // Validate SQL
  const validateSql = async () => {
    if (!sqlContent.trim()) {
      showSnackbar('Please enter SQL content to validate', 'warning');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manage-sql/validate-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql_content: sqlContent
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.is_valid) {
        setValidationStatus('valid');
        showSnackbar('SQL validation passed successfully!', 'success');
      } else {
        setValidationStatus('invalid');
        showSnackbar(result.message || 'SQL validation failed', 'error');
      }
    } catch (error) {
      console.error('Error validating SQL:', error);
      setValidationStatus('invalid');
      showSnackbar('Network error during validation', 'error');
    } finally {
      setValidating(false);
    }
  };

  // Save SQL
  const saveSql = async () => {
    if (!selectedSqlCode) {
      showSnackbar('Please select a SQL code first', 'warning');
      return;
    }

    if (!sqlContent.trim()) {
      showSnackbar('Please enter SQL content to save', 'warning');
      return;
    }

    if (validationStatus !== 'valid') {
      showSnackbar('Please validate SQL before saving', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manage-sql/save-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql_code: selectedSqlCode,
          sql_content: sqlContent
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOriginalSqlContent(sqlContent);
        setHasUnsavedChanges(false);
        showSnackbar(`SQL saved successfully for ${selectedSqlCode}!`, 'success');
      } else {
        showSnackbar(result.message || 'Failed to save SQL', 'error');
      }
    } catch (error) {
      console.error('Error saving SQL:', error);
      showSnackbar('Network error while saving SQL', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle SQL code selection
  const handleSqlCodeChange = (event, newValue) => {
    if (hasUnsavedChanges) {
      const confirmChange = window.confirm('You have unsaved changes. Do you want to continue?');
      if (!confirmChange) return;
    }
    
    setSelectedSqlCode(newValue);
    if (newValue) {
      fetchSqlLogic(newValue);
    } else {
      setSqlContent('');
      setOriginalSqlContent('');
      setValidationStatus(null);
    }
  };

  // Handle SQL content change
  const handleSqlContentChange = (value) => {
    setSqlContent(value || '');
  };

  // Reset to original content
  const resetContent = () => {
    setSqlContent(originalSqlContent);
    setValidationStatus(null);
  };

  // Get validation chip
  const getValidationChip = () => {
    if (validationStatus === 'valid') {
      return <Chip icon={<CheckCircle />} label="Valid" color="success" size="small" />;
    } else if (validationStatus === 'invalid') {
      return <Chip icon={<Close />} label="Invalid" color="error" size="small" />;
    }
    return null;
  };

  return (
    <Box sx={{ 
      p: 2, 
      minHeight: '100vh',
      backgroundColor: isDarkMode ? 'grey.900' : 'grey.50'
    }}>
      {/* Main Content */}
      <Grid container spacing={2}>
        {/* Left Panel - SQL Code Selection */}
        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ 
            height: 'fit-content', 
            borderRadius: 2,
            background: isDarkMode 
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
          }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: isDarkMode ? '#60a5fa' : '#2563eb'
              }}>
                <Search sx={{ fontSize: '1.3rem' }} />
                SQL Code Selection
              </Typography>
              
              <Autocomplete
                value={selectedSqlCode}
                onChange={handleSqlCodeChange}
                options={sqlCodes}
                loading={fetchingCodes}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search SQL Code"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {fetchingCodes ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: isDarkMode ? '#60a5fa' : '#2563eb',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: isDarkMode ? '#60a5fa' : '#2563eb',
                        }
                      }
                    }}
                  />
                )}
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAllSqlCodes}
                disabled={fetchingCodes}
                fullWidth
                size="small"
                sx={{
                  borderRadius: 2,
                  borderColor: isDarkMode ? '#60a5fa' : '#2563eb',
                  color: isDarkMode ? '#60a5fa' : '#2563eb',
                  '&:hover': {
                    borderColor: isDarkMode ? '#3b82f6' : '#1d4ed8',
                    backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)'
                  }
                }}
              >
                Refresh Codes
              </Button>


            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - SQL Editor */}
        <Grid item xs={12} md={9}>
          <Card elevation={3} sx={{ 
            borderRadius: 2,
            background: isDarkMode 
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
          }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                p: 1.5,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: isDarkMode ? '#60a5fa' : '#2563eb'
                }}>
                  <Edit sx={{ fontSize: '1.3rem' }} />
                  {selectedSqlCode ? selectedSqlCode : 'SQL Editor'}
                  {getValidationChip()}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Reset to original">
                    <IconButton 
                      onClick={resetContent}
                      disabled={!hasUnsavedChanges}
                      color="secondary"
                      size="small"
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Monaco SQL Editor */}
              <Box sx={{ 
                border: 2, 
                borderColor: isDarkMode ? '#374151' : '#d1d5db', 
                borderRadius: 2, 
                mb: 2,
                height: '280px',
                overflow: 'hidden',
                boxShadow: isDarkMode 
                  ? 'inset 0 2px 4px rgba(0,0,0,0.3)' 
                  : 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <Editor
                  height="280px"
                  language="sql"
                  theme={isDarkMode ? 'vs-dark' : 'vs-light'}
                  value={sqlContent}
                  onChange={handleSqlContentChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    tabSize: 2,
                    wordWrap: 'on',
                    automaticLayout: true,
                    readOnly: fetchingLogic
                  }}
                  loading={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '280px' 
                    }}>
                      <CircularProgress />
                    </Box>
                  }
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={validateSql}
                    disabled={validating || !sqlContent.trim()}
                    color="info"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {validating ? 'Validating...' : 'Validate SQL'}
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={saveSql}
                    disabled={saving || !selectedSqlCode || validationStatus !== 'valid'}
                    color="success"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(34, 197, 94, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save SQL'}
                  </Button>
                </Box>

                {hasUnsavedChanges && (
                  <Chip 
                    label="Unsaved Changes" 
                    color="warning" 
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                )}
              </Box>

              {/* Status Information */}
              {selectedSqlCode && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', 
                  borderRadius: 2,
                  border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        <strong>Active Code:</strong> {selectedSqlCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        <strong>Length:</strong> {sqlContent.length} chars
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        <strong>Status:</strong> {
                          validationStatus === 'valid' ? 'Valid & Ready' :
                          validationStatus === 'invalid' ? 'Invalid' :
                          hasUnsavedChanges ? 'Modified' :
                          'Loaded'
                        }
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          SQL Preview - {selectedSqlCode}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1,
            height: '400px'
          }}>
            <Editor
              height="400px"
              language="sql"
              theme={isDarkMode ? 'vs-dark' : 'vs-light'}
              value={sqlContent || '-- No SQL content available --'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageSQLPage;
