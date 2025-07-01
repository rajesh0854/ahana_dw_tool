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
  Tooltip,
  Switch,
  FormControlLabel,
  Container,
  Stack
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Save,
  Refresh,
  PlayArrow,
  Edit,
  Close,
  Add,
  Code,
  DataObject
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Editor from '@monaco-editor/react';

const ManageSQLPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // All state variables
  const [sqlCodes, setSqlCodes] = useState([]);
  const [selectedSqlCode, setSelectedSqlCode] = useState(null);
  const [newSqlCode, setNewSqlCode] = useState('');
  const [sqlContent, setSqlContent] = useState('');
  const [originalSqlContent, setOriginalSqlContent] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingCodes, setFetchingCodes] = useState(false);
  const [fetchingLogic, setFetchingLogic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [validationStatus, setValidationStatus] = useState(null);

  // State for Autocomplete input to allow clearing it
  const [inputValue, setInputValue] = useState('');
  
  // Dialog states
  const [previewDialog, setPreviewDialog] = useState(false);

  useEffect(() => {
    fetchAllSqlCodes();
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
  
  const saveSql = async () => {
    const codeToSave = isCreating ? newSqlCode.trim() : selectedSqlCode;
    
    if (!codeToSave) {
      showSnackbar('SQL code name is required.', 'error');
      return;
    }
    if (codeToSave.includes(' ')) {
        showSnackbar('Spaces are not allowed in SQL code name.', 'error');
        return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manage-sql/save-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_code: codeToSave, sql_content: sqlContent }),
      });
      const result = await response.json();
      
      if (result.success) {
        setOriginalSqlContent(sqlContent);
        showSnackbar(`SQL saved successfully for ${codeToSave}!`, 'success');
        if (isCreating) {
          setSqlCodes(prev => [...prev, codeToSave].sort());
          setSelectedSqlCode(codeToSave);
          setIsCreating(false);
        }
      } else {
        showSnackbar(result.message || 'Failed to save SQL.', 'error');
      }
    } catch (error) {
      showSnackbar('Network error while saving SQL.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCode = (event, newValue) => {
    setSelectedSqlCode(newValue);
    if (newValue) {
      fetchSqlLogic(newValue);
    } else {
      setSqlContent('');
      setOriginalSqlContent('');
      setValidationStatus(null);
    }
  };
  
  const handleContentChange = (value) => {
    setSqlContent(value || '');
    setValidationStatus(null); // Invalidate on change
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedSqlCode(null);
    setNewSqlCode('');
    setSqlContent('');
    setOriginalSqlContent('');
    setValidationStatus(null);
  };
  
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewSqlCode('');
  };

  const isSaveEnabled = () => {
    const hasCode = isCreating ? newSqlCode.trim() !== '' : selectedSqlCode !== null;
    return hasCode && validationStatus === 'valid' && !saving;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: 'background.default', // Use theme background
      color: 'text.primary' // Use theme text color
    }}>
      <Container maxWidth={false} sx={{ py: 2, px: 3, mb: 4 }}>
        {/* Top Control Bar */}
        <Box sx={{ 
          mb: 2, 
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: 'background.paper', // Use theme paper color
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Grid container spacing={1} alignItems="center">
            {isCreating ? (
              <>
                <Grid item xs>
                  <TextField
                    label="New SQL Code Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newSqlCode}
                    onChange={(e) => setNewSqlCode(e.target.value.replace(/\s/g, ''))}
                    helperText="No spaces allowed"
                  />
                </Grid>
                <Grid item>
                  <Button onClick={handleCancelCreate} size="small">Cancel</Button>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs>
                  <Autocomplete
                    value={selectedSqlCode}
                    onChange={handleSelectCode}
                    options={sqlCodes}
                    loading={fetchingCodes}
                    size="small"
                    renderInput={(params) => <TextField {...params} label="Select SQL Code" />}
                  />
                </Grid>
                <Grid item>
                  <Tooltip title="Create New SQL Code">
                    <IconButton onClick={handleCreateNew} size="small">
                      <Add />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip title="Refresh List">
                    <IconButton onClick={fetchAllSqlCodes} disabled={fetchingCodes} size="small">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        {/* Editor Card */}
        <Card sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Code color="primary" />
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {isCreating ? (newSqlCode || 'New SQL Code') : (selectedSqlCode || 'SQL Editor')}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                    {validationStatus === 'valid' && <Chip label="Valid" color="success" size="small" />}
                    {validationStatus === 'invalid' && <Chip label="Invalid" color="error" size="small" />}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" onClick={validateSql} disabled={!sqlContent || validating} size="small">
                      Validate
                    </Button>
                    <Button variant="contained" onClick={saveSql} disabled={!isSaveEnabled()} color="success" size="small">
                      {isCreating ? 'Create' : 'Save'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ height: '60vh' }}>
              <Editor
                height="100%"
                language="sql"
                value={sqlContent}
                onChange={handleContentChange}
                theme={isDarkMode ? 'vs-dark' : 'vs-light'} // This is the crucial fix
                options={{ minimap: { enabled: false }, automaticLayout: true }}
              />
            </Box>
          </CardContent>
        </Card>
      </Container>
      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageSQLPage;
