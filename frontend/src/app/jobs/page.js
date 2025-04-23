"use client";

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Tooltip,
  useMediaQuery,
  Alert
} from '@mui/material';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import { VisibilityOutlined, Schedule, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import JobScheduleDialog from './JobScheduleDialog';

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme, darkMode }) => ({
  maxHeight: '70vh',
  '& .MuiTableCell-head': {
    backgroundColor: darkMode ? '#2D3748' : '#EDF2F7',
    color: darkMode ? '#F7FAFC' : '#1A202C',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  '& .MuiTableCell-body': {
    color: darkMode ? '#E2E8F0' : '#2D3748',
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  },
}));

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const fullScreen = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Fetch all jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Function to fetch all jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/job/get_all_jobs');
      
      // Transform the array data into an array of objects with named properties
      const formattedJobs = response.data.map(job => ({
        JOBID: job[0],
        JOBFLWID: job[1],
        MAPREF: job[2],
        TRGSCHM: job[3],
        TRGTBTYP: job[4],
        TRGTBNM: job[5]
      }));
      
      setJobs(formattedJobs);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch job details
  const fetchJobDetails = async (mapref) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`http://localhost:5000/job/get_job_details/${mapref}`);
      
      // Format the job config data
      const configData = response.data.mapper_cfg;
      const formattedConfig = {
        MAPDESC: configData[0],
        TRGSCHM: configData[1],
        TRGTBTYP: configData[2],
        TRGTBNM: configData[3],
        FRQCD: configData[4],
        SRCSYSTM: configData[5],
        LGVRFYFLG: configData[6],
        STFLG: configData[7],
        BLKPRCROWS: configData[8]
      };
      
      // Format the mapper details data
      const detailsData = response.data.mapper_details;
      const formattedDetails = detailsData.map(detail => ({
        MAPREF: detail[0],
        TRGCLNM: detail[1],
        TRGCLDTYP: detail[2],
        TRGKEYFLG: detail[3],
        TRGKEYSEQ: detail[4],
        TRGCLDESC: detail[5],
        MAPLOGIC: detail[6],
        KEYCLNM: detail[7],
        VALCLNM: detail[8],
        SCDTYP: detail[9]
      }));
      
      setJobDetails({
        config: formattedConfig,
        details: formattedDetails
      });
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to fetch job details. Please try again later.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle opening of job details dialog
  const handleViewDetails = (job) => {
    setSelectedJob(job);
    fetchJobDetails(job.MAPREF);
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setJobDetails(null);
    setSelectedJob(null);
  };

  // Handle scheduling
  const handleScheduleJob = (job) => {
    setSelectedJob(job);
    setOpenScheduleDialog(true);
  };

  // Handle close of job schedule dialog
  const handleCloseScheduleDialog = () => {
    setOpenScheduleDialog(false);
    // Don't reset selectedJob here because it might be needed for the details dialog
  };

  // Table header columns
  const columns = [
    { id: 'JOBID', label: 'Job ID' },
    { id: 'JOBFLWID', label: 'Job Flow ID' },
    { id: 'MAPREF', label: 'Mapping Reference' },
    { id: 'TRGSCHM', label: 'Target Schema' },
    { id: 'TRGTBTYP', label: 'Target Table Type' },
    { id: 'TRGTBNM', label: 'Target Table Name' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom color={darkMode ? 'white' : 'text.primary'}>
          Jobs Management
        </Typography>
        <Typography variant="body1" color={darkMode ? 'gray.300' : 'text.secondary'} mb={3}>
          View and manage all your data warehouse jobs
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={darkMode ? 3 : 1} 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          backgroundColor: darkMode ? '#1E293B' : 'white',
          border: darkMode ? '1px solid #2D3748' : 'none'
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress color={darkMode ? 'primary' : 'secondary'} />
          </Box>
        ) : (
          <StyledTableContainer darkMode={darkMode}>
            <Table stickyHeader aria-label="jobs table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.id === 'actions' ? 'center' : 'left'}
                      sx={{ minWidth: column.id === 'actions' ? 150 : 120 }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow hover key={job.JOBID} sx={{ cursor: 'pointer' }}>
                    {columns.map((column) => {
                      if (column.id === 'actions') {
                        return (
                          <TableCell key={column.id} align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(job);
                                  }}
                                >
                                  <VisibilityOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Schedule Job">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleJob(job);
                                  }}
                                >
                                  <Schedule />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={column.id}>
                          {job[column.id]}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      No jobs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}
      </Paper>

      {/* Job Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          // Only close when the close button is clicked, not on backdrop click or escape key
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleCloseDialog();
          }
        }}
        fullScreen={fullScreen}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? '#1E293B' : 'white',
            color: darkMode ? 'white' : 'inherit',
            height: '95vh',
            maxHeight: '95vh',
            borderRadius: { xs: 0, sm: 2 },
            m: { xs: 0, sm: 2 },
            overflow: 'hidden',
            backgroundImage: darkMode ? 
              'linear-gradient(to bottom right, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))' : 
              'linear-gradient(to bottom right, rgba(249, 250, 251, 0.8), rgba(255, 255, 255, 0.8))',
            backdropFilter: 'blur(8px)',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: darkMode ? 
              '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : 
              '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
            backdropFilter: 'blur(8px)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityOutlined 
              sx={{ 
                mr: 1.5, 
                color: darkMode ? 'primary.main' : 'secondary.main'
              }} 
            />
            <Typography variant="h5" fontWeight="500">
              Job Details: <Box component="span" sx={{ color: darkMode ? 'primary.light' : 'secondary.main' }}>{selectedJob?.MAPREF}</Box>
            </Typography>
          </Box>
          <IconButton 
            edge="end" 
            onClick={handleCloseDialog} 
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
        <DialogContent 
          dividers 
          sx={{ 
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: darkMode ? 'transparent' : 'transparent',
            borderTop: 'none',
            borderBottom: 'none'
          }}
        >
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress color={darkMode ? 'primary' : 'secondary'} />
            </Box>
          ) : (
            <>
              {jobDetails && (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      gutterBottom 
                      color={darkMode ? 'white' : 'text.primary'}
                      sx={{ 
                        borderLeft: darkMode ? '4px solid #3B82F6' : '4px solid #7C3AED',
                        pl: 2, 
                        py: 0.5,
                        fontWeight: 500
                      }}
                    >
                      Job Configuration
                    </Typography>
                    <Paper 
                      elevation={darkMode ? 3 : 1} 
                      sx={{ 
                        overflow: 'hidden',
                        backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(12px)',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: 2
                      }}
                    >
                      <TableContainer>
                        <Table aria-label="job configuration table">
                          <TableHead>
                            <TableRow>
                              {Object.keys(jobDetails.config).map(key => (
                                <TableCell 
                                  key={key}
                                  sx={{ 
                                    backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                  }}
                                >
                                  {
                                    key === 'MAPDESC' ? 'Mapper Description' :
                                    key === 'TRGSCHM' ? 'Target Schema' :
                                    key === 'TRGTBTYP' ? 'Target Table Type' :
                                    key === 'TRGTBNM' ? 'Target Table Name' :
                                    key === 'FRQCD' ? 'Frequency Code' :
                                    key === 'SRCSYSTM' ? 'Source System' :
                                    key === 'LGVRFYFLG' ? 'Logic Verification Flag' :
                                    key === 'STFLG' ? 'STF Flag' :
                                    key === 'BLKPRCROWS' ? 'Bulk Process Rows' : key
                                  }
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow hover>
                              {Object.entries(jobDetails.config).map(([key, value]) => (
                                <TableCell 
                                  key={key}
                                  sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                                    fontFamily: key === 'MAPLOGIC' ? 'monospace' : 'inherit',
                                    textAlign: 'center',
                                    fontWeight: key === 'MAPDESC' ? 'medium' : 'normal'
                                  }}
                                >
                                  {value || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>

                  <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      gutterBottom 
                      color={darkMode ? 'white' : 'text.primary'}
                      sx={{ 
                        borderLeft: darkMode ? '4px solid #3B82F6' : '4px solid #7C3AED',
                        pl: 2, 
                        py: 0.5,
                        fontWeight: 500
                      }}
                    >
                      Mapper Details
                    </Typography>
                    <Paper 
                      elevation={darkMode ? 3 : 1} 
                      sx={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(12px)',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: 2
                      }}
                    >
                      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                        <Table stickyHeader size="small" aria-label="mapper details table">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Target Column</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Data Type</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Key Flag</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Key Sequence</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Description</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Map Logic</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Key Column</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>Value Column</TableCell>
                              <TableCell sx={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)', fontWeight: 'bold' }}>SCD Type</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {jobDetails.details.map((detail, index) => (
                              <TableRow 
                                key={index} 
                                hover
                                sx={{
                                  backgroundColor: index % 2 === 0 ? 
                                    (darkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(249, 250, 251, 0.4)') : 
                                    'transparent',
                                  '&:hover': {
                                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(243, 244, 246, 0.8)'
                                  }  
                                }}
                              >
                                <TableCell 
                                  sx={{ 
                                    fontWeight: detail.TRGKEYFLG === 'Y' ? 'bold' : 'normal',
                                    color: detail.TRGKEYFLG === 'Y' ? 
                                      (darkMode ? '#3B82F6' : '#7C3AED') : 
                                      (darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)')
                                  }}
                                >
                                  {detail.TRGCLNM}
                                </TableCell>
                                <TableCell>{detail.TRGCLDTYP}</TableCell>
                                <TableCell>
                                  {detail.TRGKEYFLG === 'Y' ? 
                                    <Box 
                                      component="span" 
                                      sx={{ 
                                        display: 'inline-block',
                                        px: 1.5, 
                                        py: 0.5, 
                                        borderRadius: 1, 
                                        backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                                        color: darkMode ? '#3B82F6' : '#7C3AED',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      YES
                                    </Box> : 
                                    <Box 
                                      component="span" 
                                      sx={{ 
                                        display: 'inline-block',
                                        px: 1.5, 
                                        py: 0.5, 
                                        borderRadius: 1, 
                                        backgroundColor: 'transparent',
                                        color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      NO
                                    </Box>
                                  }
                                </TableCell>
                                <TableCell>{detail.TRGKEYSEQ}</TableCell>
                                <TableCell>{detail.TRGCLDESC}</TableCell>
                                <TableCell 
                                  sx={{ 
                                    maxWidth: 250, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  <Tooltip title={detail.MAPLOGIC || ""} placement="top">
                                    <span>{detail.MAPLOGIC || "-"}</span>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>{detail.KEYCLNM || "-"}</TableCell>
                                <TableCell>{detail.VALCLNM || "-"}</TableCell>
                                <TableCell>{detail.SCDTYP || "-"}</TableCell>
                              </TableRow>
                            ))}
                            {jobDetails.details.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={9} align="center">
                                  No mapper details found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions 
          sx={{ 
            padding: 2, 
            borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            justifyContent: 'flex-end',
            gap: 1
          }}
        >
          <Button 
            onClick={handleCloseDialog} 
            variant="contained" 
            color="primary"
            startIcon={<Close />}
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
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Job Schedule Dialog */}
      <JobScheduleDialog 
        open={openScheduleDialog} 
        onClose={handleCloseScheduleDialog} 
        job={selectedJob}
        availableJobs={jobs}
      />
    </motion.div>
  );
};

export default JobsPage;
