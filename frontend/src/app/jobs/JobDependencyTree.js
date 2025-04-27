import React, { useMemo, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tooltip,
  Chip,
  IconButton,
  Badge,
  Collapse
} from '@mui/material';
import { 
  AccountTree as TreeIcon,
  ArrowDownward as ArrowDownIcon,
  Bolt as BoltIcon,
  CheckCircleOutline as CheckCircleIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

// Styled components
const JobNode = styled(Paper)(({ theme, darkMode, isRoot, hasChildren }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px 16px',
  borderRadius: '10px',
  marginBottom: '10px',
  position: 'relative',
  backgroundColor: isRoot 
    ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
    : (darkMode ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.9)'),
  border: '1px solid',
  borderColor: isRoot 
    ? (darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)')
    : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  boxShadow: isRoot
    ? (darkMode ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 4px 12px rgba(59, 130, 246, 0.1)')
    : (darkMode ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.05)'),
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: darkMode 
      ? '0 6px 16px rgba(0, 0, 0, 0.3)' 
      : '0 6px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)',
    backgroundColor: isRoot 
      ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)')
      : (darkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(249, 250, 251, 0.95)'),
  },
}));

const ConnectingLine = styled(Box)(({ theme, darkMode }) => ({
  position: 'absolute',
  width: '2px',
  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
  zIndex: 0,
}));

const HorizontalLine = styled(Box)(({ theme, darkMode }) => ({
  position: 'absolute',
  height: '2px',
  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
  left: '-10px',
  width: '10px',
  zIndex: 0,
}));

const StyledBadge = styled(Badge)(({ theme, darkMode }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: darkMode ? '#34D399' : '#059669',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '10px',
    padding: '0 4px',
    minWidth: '16px',
    height: '16px',
    right: -2,
    top: -2,
  },
}));

// Recursive component for rendering job nodes
const JobNodeComponent = ({ 
  job, 
  jobMap, 
  darkMode, 
  level = 0, 
  isLastChild = false, 
  handleViewDetails = () => {}, 
  handleViewLogic = () => {}
}) => {
  // Find children jobs that depend on this job
  const childJobs = useMemo(() => {
    return Object.values(jobMap).filter(j => j.DPND_JOBSCHID === job.JOBSCHID);
  }, [jobMap, job.JOBSCHID]);

  // State to track if children are expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand the first level only

  // Toggle expansion state
  const toggleExpand = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  // Calculate indentation for hierarchy display
  const paddingLeft = 24 * level;
  
  return (
    <Box sx={{ position: 'relative', ml: level > 0 ? 2 : 0 }}>
      {/* Draw connecting lines for hierarchy */}
      {level > 0 && (
        <HorizontalLine darkMode={darkMode} sx={{ top: '50%' }} />
      )}
      
      {/* Main job node */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: level * 0.1 }}
      >
        <JobNode 
          darkMode={darkMode} 
          isRoot={level === 0}
          hasChildren={childJobs.length > 0}
          sx={{ 
            ml: `${paddingLeft}px`,
            width: `calc(100% - ${paddingLeft}px)`,
          }}
          onClick={() => childJobs.length > 0 && setIsExpanded(prev => !prev)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
            {/* Job status icon with badge for child count */}
            <StyledBadge
              badgeContent={childJobs.length > 0 ? childJobs.length : null}
              darkMode={darkMode}
              overlap="circular"
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mr: 1.5,
                backgroundColor: level === 0 
                  ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                  : (darkMode ? 'rgba(45, 55, 72, 0.5)' : 'rgba(229, 231, 235, 0.8)'),
                p: 0.8,
                borderRadius: '50%',
                width: 32,
                height: 32
              }}>
                {level === 0 ? (
                  <BoltIcon sx={{ 
                    fontSize: 18, 
                    color: darkMode ? '#60A5FA' : '#3B82F6' 
                  }} />
                ) : (
                  <CheckCircleIcon sx={{ 
                    fontSize: 17, 
                    color: darkMode ? '#34D399' : '#059669' 
                  }} />
                )}
              </Box>
            </StyledBadge>
            
            {/* Job ID */}
            <Tooltip title="Job Schedule ID">
              <Box
                sx={{
                  backgroundColor: darkMode ? 'rgba(22, 30, 46, 0.7)' : 'rgba(243, 244, 246, 0.9)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 6,
                  minWidth: 50,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                  mr: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: level === 0 
                      ? (darkMode ? '#60A5FA' : '#3B82F6')
                      : (darkMode ? '#E5E7EB' : '#111827'),
                  }}
                >
                  {job.JOBSCHID}
                </Typography>
              </Box>
            </Tooltip>
            
            {/* Target Table */}
            <Tooltip title="Target Schema & Table">
              <Box component="span" sx={{ 
                fontSize: '0.8125rem',
                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.75)', 
                fontFamily: 'monospace', 
                backgroundColor: darkMode ? 'rgba(22, 30, 46, 0.5)' : 'rgba(243, 244, 246, 0.8)',
                py: 0.5, 
                px: 1.2, 
                mr: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
              }}>
                {`${job.TRGSCHM}.${job.TRGTBNM}`}
              </Box>
            </Tooltip>
            
            {/* Mapping Reference */}
            <Tooltip title="Mapping Reference">
              <Chip
                label={job.MAPREF}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(229, 231, 235, 0.8)',
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  mr: 'auto',
                  '& .MuiChip-label': {
                    px: 1,
                  }
                }}
              />
            </Tooltip>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              {/* Expand/Collapse button for nodes with children */}
              {childJobs.length > 0 && (
                <Tooltip title={isExpanded ? "Collapse dependencies" : "Expand dependencies"}>
                  <IconButton 
                    size="small"
                    onClick={toggleExpand}
                    sx={{ 
                      fontSize: '0.75rem',
                      backgroundColor: darkMode ? 'rgba(45, 55, 72, 0.3)' : 'rgba(229, 231, 235, 0.6)',
                      color: darkMode ? '#E5E7EB' : '#4B5563',
                      mr: 0.75,
                      width: 26,
                      height: 26,
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(45, 55, 72, 0.5)' : 'rgba(229, 231, 235, 0.8)',
                      }
                    }}
                  >
                    {isExpanded ? 
                      <ExpandLessIcon fontSize="small" sx={{ fontSize: 18 }} /> : 
                      <ExpandMoreIcon fontSize="small" sx={{ fontSize: 18 }} />
                    }
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="View Job Details">
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(job);
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    color: darkMode ? '#60A5FA' : '#3B82F6',
                    mr: 0.75,
                    width: 30,
                    height: 30,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    }
                  }}
                >
                  <KeyboardArrowRightIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="View SQL Logic">
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewLogic(job);
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                    color: darkMode ? '#A78BFA' : '#8B5CF6',
                    width: 30,
                    height: 30,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                    }
                  }}
                >
                  <CodeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </JobNode>
      </motion.div>
      
      {/* Render child jobs recursively with collapse animation */}
      {childJobs.length > 0 && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ position: 'relative', ml: 2 }}>
            {/* Vertical connecting line */}
            <ConnectingLine 
              darkMode={darkMode} 
              sx={{ 
                left: level > 0 ? 0 : 10,
                top: '0px',
                height: '100%'
              }}
            />
            
            {childJobs.map((childJob, index) => (
              <JobNodeComponent
                key={childJob.JOBSCHID}
                job={childJob}
                jobMap={jobMap}
                darkMode={darkMode}
                level={level + 1}
                isLastChild={index === childJobs.length - 1}
                handleViewDetails={handleViewDetails}
                handleViewLogic={handleViewLogic}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const JobDependencyTree = ({ 
  jobs = [], 
  darkMode = false, 
  handleViewDetails,
  handleViewLogic
}) => {
  const [expandAll, setExpandAll] = useState(false);

  // Create a map of jobs by ID for easier lookup
  const jobMap = useMemo(() => {
    const map = {};
    jobs.forEach(job => {
      map[job.JOBSCHID] = job;
    });
    return map;
  }, [jobs]);
  
  // Find root jobs (jobs that don't depend on other jobs)
  const rootJobs = useMemo(() => {
    return jobs.filter(job => !job.DPND_JOBSCHID);
  }, [jobs]);
  
  // Find jobs that depend on other jobs, but the parent doesn't exist in our list
  // (This can happen if we have incomplete data)
  const orphanedJobs = useMemo(() => {
    return jobs.filter(job => 
      job.DPND_JOBSCHID && 
      !jobMap[job.DPND_JOBSCHID] && 
      !rootJobs.find(r => r.JOBSCHID === job.JOBSCHID)
    );
  }, [jobs, jobMap, rootJobs]);

  // Toggle expand/collapse all
  const toggleExpandAll = () => {
    setExpandAll(prev => !prev);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      {/* Header for the dependency view */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        borderBottom: '1px solid',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        pb: 1.5,
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TreeIcon 
            sx={{ 
              mr: 1.5, 
              color: darkMode ? 'primary.light' : 'primary.main',
              fontSize: 26
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: darkMode ? 'white' : 'text.primary',
              fontSize: '1.1rem',
              letterSpacing: '-0.02em'
            }}
          >
            Job Dependency Hierarchy
          </Typography>
          
          <Tooltip title={
            <Box sx={{ p: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', mb: 1, fontWeight: 500 }}>
                Job Dependency Tree Help
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Box component="li" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                  <BoltIcon sx={{ fontSize: 14, color: '#60A5FA', mr: 1, verticalAlign: 'middle' }} /> 
                  Root jobs (no dependencies)
                </Box>
                <Box component="li" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: '#34D399', mr: 1, verticalAlign: 'middle' }} /> 
                  Dependent jobs (child jobs)
                </Box>
                <Box component="li" sx={{ fontSize: '0.8rem' }}>
                  Click job cards or <ExpandMoreIcon sx={{ fontSize: 14, verticalAlign: 'middle', mx: 0.5 }} /> to expand/collapse
                </Box>
              </Box>
            </Box>
          } arrow placement="right">
            <IconButton size="small" sx={{ ml: 1, color: darkMode ? 'primary.light' : 'primary.main' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Chip
            label={`${jobs.length} Jobs`}
            size="small"
            sx={{
              ml: 2,
              height: 22,
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
              color: darkMode ? '#60A5FA' : '#3B82F6',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)',
            }}
          />
        </Box>
      </Box>
      
      {/* Display root jobs as top-level nodes */}
      {rootJobs.map(job => (
        <JobNodeComponent 
          key={job.JOBSCHID}
          job={job}
          jobMap={jobMap}
          darkMode={darkMode}
          handleViewDetails={handleViewDetails}
          handleViewLogic={handleViewLogic}
        />
      ))}
      
      {/* Display orphaned jobs separately if any */}
      {orphanedJobs.length > 0 && (
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: darkMode ? 'warning.light' : 'warning.dark',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              mb: 2
            }}
          >
            <ArrowDownIcon sx={{ mr: 1, fontSize: 20 }} />
            Jobs with External Dependencies
          </Typography>
          
          {orphanedJobs.map(job => (
            <JobNodeComponent 
              key={job.JOBSCHID}
              job={job}
              jobMap={jobMap}
              darkMode={darkMode}
              handleViewDetails={handleViewDetails}
              handleViewLogic={handleViewLogic}
            />
          ))}
        </Box>
      )}
      
      {/* Message when no jobs are found */}
      {jobs.length === 0 && (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(243, 244, 246, 0.7)',
            border: '1px dashed',
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="body1" color={darkMode ? 'gray.300' : 'gray.600'}>
            No scheduled jobs found to display
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default JobDependencyTree; 