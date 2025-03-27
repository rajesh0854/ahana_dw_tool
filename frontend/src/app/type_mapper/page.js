"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
// Import Material UI components
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  TextField, 
  MenuItem, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
  TablePagination,
  useTheme
} from "@mui/material";
import { 
  Add as AddIcon, 
  Cancel as CancelIcon, 
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from "@mui/icons-material";

export default function ParameterPage() {
  const theme = useTheme();
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [types, setTypes] = useState([]);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form state
  const [newParameter, setNewParameter] = useState({
    PRTYP: "",
    PRCD: "",
    PRDESC: "",
    PRVAL: ""
  });

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/mapping/parameter_mapping");
      setParameters(response.data);
      
      // Extract unique parameter types for filtering
      const uniqueTypes = [...new Set(response.data.map(param => param.PRTYP))];
      setTypes(uniqueTypes);
      
      setLoading(false);
    } catch (err) {
      setError("Failed to load parameters. Please try again later.");
      setLoading(false);
    }
  };

  const handleAddParameter = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/mapping/parameter_add", newParameter);
      
      // Reset form and refresh data
      setNewParameter({
        PRTYP: "",
        PRCD: "",
        PRDESC: "",
        PRVAL: ""
      });
      setShowAddForm(false);
      fetchParameters();
    } catch (err) {
      setError("Failed to add parameter. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewParameter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy HH:mm");
    } catch (err) {
      return dateString.toString();
    }
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredParameters = filterType 
    ? parameters.filter(param => param.PRTYP === filterType)
    : parameters;
    
  // Create paginated parameters
  const paginatedParameters = filteredParameters.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      py: 4 
    }}>
      <Container maxWidth="lg">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 2,
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              System Parameters
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Filter by Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: <FilterListIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                {types.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
              
              <Button
                variant={showAddForm ? "outlined" : "contained"}
                startIcon={showAddForm ? <CancelIcon /> : <AddIcon />}
                onClick={() => setShowAddForm(!showAddForm)}
                color={showAddForm ? "error" : "primary"}
              >
                {showAddForm ? "Cancel" : "Add Parameter"}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError(null)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          {showAddForm && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 4, 
                backgroundColor: '#fafafa',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#424242' }}>
                Add New Parameter
              </Typography>
              <form onSubmit={handleAddParameter}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Type"
                      name="PRTYP"
                      value={newParameter.PRTYP}
                      onChange={handleChange}
                      required
                      placeholder="DB, Datatype, etc."
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Code"
                      name="PRCD"
                      value={newParameter.PRCD}
                      onChange={handleChange}
                      required
                      placeholder="Parameter code"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="PRDESC"
                      value={newParameter.PRDESC}
                      onChange={handleChange}
                      required
                      placeholder="Parameter description"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      name="PRVAL"
                      value={newParameter.PRVAL}
                      onChange={handleChange}
                      required
                      placeholder="Parameter value"
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? "Saving..." : "Save Parameter"}
                  </Button>
                </Box>
              </form>
            </Paper>
          )}

          {loading && !showAddForm ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
              <TableContainer 
                component={Paper} 
                elevation={1} 
                sx={{ 
                  borderRadius: '8px 8px 0 0',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none'
                }}
              >
                <Table sx={{ minWidth: 650 }} size="medium">
                  <TableHead sx={{ backgroundColor: theme.palette.primary.light + '20' }}>
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          Type
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          Code
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          Description
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          Value
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          Created
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          Updated
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedParameters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {parameters.length === 0 ? "No parameters found" : "No parameters match the selected filter"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedParameters.map((param, index) => (
                        <TableRow 
                          key={index} 
                          hover 
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover
                            }
                          }}
                        >
                          <TableCell>
                            <Chip 
                              label={param.PRTYP} 
                              size="small" 
                              sx={{ 
                                backgroundColor: theme.palette.primary.light + '30', 
                                color: theme.palette.primary.dark,
                                fontWeight: 500,
                                borderRadius: '4px',
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }} 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {param.PRCD}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {param.PRDESC}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                backgroundColor: theme.palette.grey[100], 
                                p: 0.7, 
                                px: 1.2,
                                borderRadius: 1, 
                                display: 'inline-block',
                                border: '1px solid',
                                borderColor: theme.palette.grey[300]
                              }}
                            >
                              {param.PRVAL}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(param.PRRECCRDT)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(param.PRRECUPDT)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination component */}
              <TablePagination
                component="div"
                count={filteredParameters.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  borderRadius: '0 0 8px 8px',
                  backgroundColor: theme.palette.background.paper,
                  borderLeft: '1px solid',
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                    color: theme.palette.text.secondary
                  },
                  '.MuiTablePagination-actions': {
                    marginLeft: 2
                  }
                }}
              />
            </Box>
          )}

          {filteredParameters.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
                * Parameter values are system configuration settings that control application behavior
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {Math.min(rowsPerPage, filteredParameters.length)} of {filteredParameters.length} parameters
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}