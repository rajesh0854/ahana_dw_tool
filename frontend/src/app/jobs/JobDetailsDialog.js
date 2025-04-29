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
  Chip,
  Fade,
  Alert,
  Divider
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { 
  VisibilityOutlined, 
  Close, 
  KeyOutlined,
  DescriptionOutlined,
  ErrorOutline,
  CheckCircleOutline as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  AccountTree as TreeIcon
} from '@mui/icons-material';
import { useTheme } from '@/context/ThemeContext';

const JobDetailsDialog = ({ open, onClose, job, allJobs = [] }) => {
  const [jobDetails, setJobDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const fullScreen = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Find parent and child jobs based on dependencies
  const parentJob = allJobs.find(j => job?.DPND_JOBSCHID === j.JOBSCHID);
  const childJobs = allJobs.filter(j => j.DPND_JOBSCHID === job?.JOBSCHID && j.JOB_SCHEDULE_STATUS === 'Scheduled');

  // Function to fetch job details
  const fetchJobDetails = async (mapref) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/job/get_job_details/${mapref}`);
      
      if (response.data && response.data.job_details) {
        const details = response.data.job_details;
        // Format job details to object format for each row in the array
        if (Array.isArray(details) && details.length > 0) {
          const formattedDetails = details.map(detail => ({
            TRGCLNM: detail[0],
            TRGCLDTYP: detail[1],
            TRGKEYFLG: detail[2],
            TRGKEYSEQ: detail[3],
            TRGCLDESC: detail[4],
            MAPLOGIC: detail[5],
            KEYCLNM: detail[6],
            VALCLNM: detail[7],
            SCDTYP: detail[8]
          }));
          setJobDetails(formattedDetails);
        } else {
          setJobDetails([]);
        }
      } else {
        setJobDetails([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to fetch job details. Please try again later.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch job details when the dialog opens with a job
  useEffect(() => {
    if (open && job) {
      fetchJobDetails(job.MAPREF);
    } else {
      // Reset state when dialog closes
      setJobDetails(null);
      setLoadingDetails(false);
    }
  }, [open, job]);

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // Only close when the close button is clicked, not on backdrop click or escape key
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onClose();
        }
      }}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: darkMode ? '#1A202C' : '#FFFFFF',
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
              color: darkMode ? 'primary.main' : 'secondary.main',
              fontSize: 28
            }} 
          />
          <Typography variant="h5" fontWeight="600" sx={{ textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
            Job Details: <Box component="span" sx={{ 
              color: darkMode ? 'primary.light' : 'secondary.main',
              backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              ml: 1
            }}>{job?.MAPREF}</Box>
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box component="span" sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            px: 1.5,
            py: 0.5,
            minWidth: '90px',
            borderRadius: 8,
            backgroundColor: job?.JOB_SCHEDULE_STATUS === 'Scheduled' 
              ? (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)') 
              : (darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)'),
            color: job?.JOB_SCHEDULE_STATUS === 'Scheduled' 
              ? (darkMode ? '#34D399' : '#059669') 
              : (darkMode ? '#FBBF24' : '#D97706'),
            border: '1px solid',
            borderColor: job?.JOB_SCHEDULE_STATUS === 'Scheduled' 
              ? (darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)') 
              : (darkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'),
            textAlign: 'center',
            boxShadow: job?.JOB_SCHEDULE_STATUS === 'Scheduled' 
              ? (darkMode ? '0 1px 3px rgba(16, 185, 129, 0.1)' : 'none')
              : (darkMode ? '0 1px 3px rgba(245, 158, 11, 0.1)' : 'none'),
          }}>
            {job?.JOB_SCHEDULE_STATUS === 'Scheduled' ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Scheduled
              </>
            ) : (
              <>
                <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Not Scheduled
              </>
            )}
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
        </Box>
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
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%" 
            flexDirection="column"
            gap={2}
          >
            <CircularProgress color={darkMode ? 'primary' : 'secondary'} size={60} />
            <Typography variant="body1" color={darkMode ? 'gray.300' : 'gray.700'}>
              Loading job details...
            </Typography>
          </Box>
        ) : error ? (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 3,
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                color: darkMode ? '#FCA5A5' : '#B91C1C',
                border: '1px solid',
                borderColor: darkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.2)',
                '& .MuiAlert-icon': {
                  color: darkMode ? '#FCA5A5' : '#B91C1C'
                }
              }}
              icon={<ErrorOutline />}
            >
              {error}
            </Alert>
          </Fade>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 4, mt: 1 }}>
              {/* Job Dependency Information - UPDATED SECTION */}
              {job?.JOB_SCHEDULE_STATUS === 'Scheduled' && (
                <>
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    gutterBottom 
                    color={darkMode ? 'white' : 'text.primary'}
                    sx={{ 
                      borderLeft: darkMode ? '4px solid #3B82F6' : '4px solid #7C3AED',
                      pl: 2, 
                      py: 0.5,
                      mb: 2,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '1.1rem'
                    }}
                  >
                    <TreeIcon sx={{ mr: 1.5, fontSize: 22 }} />
                    Job Dependencies
                  </Typography>
                  
                  <Paper 
                    elevation={darkMode ? 3 : 1} 
                    sx={{ 
                      p: 2,
                      mb: 3,
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 2,
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Parent Job Section */}
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          color={darkMode ? 'primary.light' : 'primary.main'} 
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          <ArrowUpwardIcon sx={{ mr: 0.5, fontSize: 16 }} />
                          Depends on (Parent Job)
                        </Typography>
                        
                        {parentJob ? (
                          <Box 
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 1
                            }}
                          >
                            <Chip
                              label={`ID: ${parentJob.JOBSCHID}`}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                color: darkMode ? '#60A5FA' : '#3B82F6',
                                border: '1px solid',
                                borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)',
                              }}
                            />
                            
                            <Chip
                              label={parentJob.MAPREF}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                backgroundColor: darkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                                color: darkMode ? '#818CF8' : '#4F46E5',
                                border: '1px solid',
                                borderColor: darkMode ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.15)',
                              }}
                            />
                            
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8125rem',
                                color: darkMode ? 'primary.light' : 'primary.main', 
                                fontFamily: 'monospace', 
                                fontWeight: 500,
                                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                                py: 0.5, 
                                px: 1, 
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                              }}
                            >
                              {`${parentJob.TRGSCHM}.${parentJob.TRGTBNM}`}
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ px: 1 }}>
                            <Typography variant="body2" color={darkMode ? 'gray.400' : 'gray.600'} fontSize="0.8rem">
                              This job doesn't depend on any other job
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {/* Child Jobs Section - COMPACT VERSION */}
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          color={darkMode ? 'primary.light' : 'primary.main'} 
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          <ArrowDownwardIcon sx={{ mr: 0.5, fontSize: 16 }} />
                          Dependent Jobs ({childJobs.length})
                        </Typography>
                        
                        {childJobs.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 1, maxHeight: '60px', overflow: 'auto' }}>
                            {childJobs.map(childJob => (
                              <Tooltip 
                                key={childJob.JOBSCHID} 
                                title={`${childJob.TRGTBNM} (ID: ${childJob.JOBSCHID})`}
                                placement="top"
                              >
                                <Chip
                                  label={childJob.MAPREF}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                    backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                    color: darkMode ? '#34D399' : '#059669',
                                    border: '1px solid',
                                    borderColor: darkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ px: 1 }}>
                            <Typography variant="body2" color={darkMode ? 'gray.400' : 'gray.600'} fontSize="0.8rem">
                              No jobs depend on this job
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </>
              )}
              
              {/* Mapping Details (existing section) */}
              <Typography 
                variant="h6" 
                component="h2" 
                gutterBottom 
                color={darkMode ? 'white' : 'text.primary'}
                sx={{ 
                  borderLeft: darkMode ? '4px solid #3B82F6' : '4px solid #7C3AED',
                  pl: 2, 
                  py: 0.5,
                  mb: 3,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '1.1rem'
                }}
              >
                <DescriptionOutlined sx={{ mr: 1.5, fontSize: 22 }} />
                Job Mapping Details
              </Typography>
              
              <Paper 
                elevation={darkMode ? 3 : 1} 
                sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: 2,
                  boxShadow: darkMode ? 
                    '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : 
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                  <Table stickyHeader size="small" aria-label="job details table">
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Target Column
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Data Type
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Key Flag
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Key Sequence
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Description
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Map Logic
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Key Column
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          Value Column
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: darkMode ? '#E5E7EB' : '#111827',
                            py: 2
                          }}
                        >
                          SCD Type
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobDetails && jobDetails.length > 0 ? (
                        jobDetails.map((detail, index) => (
                          <TableRow 
                            key={index} 
                            hover
                            sx={{
                              backgroundColor: index % 2 === 0 ? 
                                (darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(249, 250, 251, 0.5)') : 
                                'transparent',
                              '&:hover': {
                                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(243, 244, 246, 0.9)',
                                boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <TableCell 
                              sx={{ 
                                fontWeight: detail.TRGKEYFLG === 'Y' ? 'bold' : 'normal',
                                color: detail.TRGKEYFLG === 'Y' ? 
                                  (darkMode ? '#3B82F6' : '#7C3AED') : 
                                  (darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'),
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              {detail.TRGKEYFLG === 'Y' && (
                                <KeyOutlined 
                                  fontSize="small" 
                                  sx={{ 
                                    color: darkMode ? '#3B82F6' : '#7C3AED',
                                    opacity: 0.7
                                  }} 
                                />
                              )}
                              {detail.TRGCLNM}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: '0.875rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                              {detail.TRGCLDTYP}
                            </TableCell>
                            <TableCell>
                              {detail.TRGKEYFLG === 'Y' ? 
                                <Chip
                                  label="YES"
                                  size="small"
                                  sx={{ 
                                    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                                    color: darkMode ? '#3B82F6' : '#7C3AED',
                                    fontWeight: 'bold',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    height: '24px'
                                  }}
                                /> : 
                                <Chip
                                  label="NO"
                                  size="small"
                                  sx={{ 
                                    backgroundColor: 'transparent',
                                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                                    fontSize: '0.75rem',
                                    height: '24px'
                                  }}
                                />
                              }
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: '0.875rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                              {detail.TRGKEYSEQ || "-"}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: '0.875rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                              maxWidth: 180,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              <Tooltip title={detail.TRGCLDESC || ""} placement="top">
                                <span>{detail.TRGCLDESC || "-"}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                maxWidth: 250, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                                backgroundColor: detail.MAPLOGIC ? 
                                  (darkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(243, 244, 246, 0.4)') : 
                                  'transparent',
                                borderRadius: '4px',
                                p: detail.MAPLOGIC ? 1 : 0
                              }}
                            >
                              <Tooltip title={detail.MAPLOGIC || ""} placement="top">
                                <span>{detail.MAPLOGIC || "-"}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: '0.875rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                              {detail.KEYCLNM || "-"}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: '0.875rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                              {detail.VALCLNM || "-"}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: '0.875rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                              {detail.SCDTYP || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell 
                            colSpan={9} 
                            align="center"
                            sx={{ 
                              py: 4,
                              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                              fontSize: '0.95rem'
                            }}
                          >
                            No job details found
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
          onClick={onClose} 
          variant="contained" 
          color={darkMode ? "primary" : "secondary"}
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
  );
};

export default JobDetailsDialog; 