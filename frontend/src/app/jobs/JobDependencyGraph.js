import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  Panel,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  toPng
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Button, 
  Tooltip,
  Chip
} from '@mui/material';
import { 
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  Download as DownloadIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Custom styled node
const JobNode = styled('div')(({ theme, darkMode, isRoot }) => ({
  padding: '12px 16px',
  borderRadius: '8px',
  minWidth: '160px',
  fontSize: '12px',
  textAlign: 'left',
  border: '1px solid',
  position: 'relative',
  boxShadow: darkMode ? 
    '0 4px 10px rgba(0, 0, 0, 0.3)' : 
    '0 4px 10px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
  backgroundColor: isRoot 
    ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
    : (darkMode ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.9)'),
  borderColor: isRoot 
    ? (darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)')
    : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  '&:hover': {
    boxShadow: darkMode ? '0 6px 16px rgba(0, 0, 0, 0.4)' : '0 6px 16px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)',
    borderColor: darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)',
  }
}));

const CustomNode = ({ data, isConnectable, id }) => {
  const isRoot = data.isRoot;
  const darkMode = data.darkMode;
  const job = data.job;
  
  return (
    <JobNode darkMode={darkMode} isRoot={isRoot}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Node Header with ID */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 0.5
        }}>
          <Chip
            label={`ID: ${job.JOBSCHID}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: isRoot 
                ? (darkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)')
                : (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)'),
              color: isRoot
                ? (darkMode ? '#60A5FA' : '#3B82F6')
                : (darkMode ? '#34D399' : '#059669'),
              border: '1px solid',
              borderColor: isRoot
                ? (darkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)')
                : (darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'),
            }}
          />
        </Box>
        
        {/* Map Reference */}
        <Typography sx={{ 
          fontWeight: 600, 
          fontSize: '0.9rem',
          color: darkMode ? 'white' : '#1A202C',
          mb: 0.5
        }}>
          {job.MAPREF}
        </Typography>
        
        {/* Target table */}
        <Box sx={{ 
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: darkMode ? '#E5E7EB' : '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }}>
          {`${job.TRGSCHM}.${job.TRGTBNM}`}
        </Box>
        
        {/* Actions - can be added here if needed */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 1,
          gap: 1
        }}>
          {data.handleViewDetails && (
            <Button 
              size="small" 
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                py: 0.25,
                px: 1,
                minWidth: 0,
                borderRadius: '4px',
                textTransform: 'none',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
              onClick={() => data.handleViewDetails(job)}
            >
              Details
            </Button>
          )}
        </Box>
      </Box>
    </JobNode>
  );
};

// Inner component with access to React Flow instance
const JobDependencyGraphInner = ({ jobs = [], darkMode = false, handleViewDetails }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowInstance = useReactFlow();
  // Add a ref for the React Flow component
  const flowRef = useRef(null);
  
  // Prepare nodes and edges from jobs data
  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    
    const jobMap = {};
    jobs.forEach(job => {
      jobMap[job.JOBSCHID] = job;
    });
    
    // Find root jobs (jobs that don't depend on other jobs)
    const rootJobs = jobs.filter(job => !job.DPND_JOBSCHID);
    // Find jobs that depend on other jobs
    const dependentJobs = jobs.filter(job => job.DPND_JOBSCHID);
    
    // Create nodes for all jobs
    const flowNodes = [];
    const flowEdges = [];
    
    // Layout variables
    let level = 0;
    const levelHeight = 150;
    const nodesPerRow = 4;
    const horizontalSpacing = 250;
    
    // Add root jobs first
    rootJobs.forEach((job, index) => {
      const x = (index % nodesPerRow) * horizontalSpacing;
      const y = Math.floor(index / nodesPerRow) * levelHeight;
      
      flowNodes.push({
        id: job.JOBSCHID.toString(),
        type: 'custom',
        position: { x, y },
        data: { 
          job,
          isRoot: true,
          darkMode,
          handleViewDetails
        }
      });
    });
    
    // Add dependent jobs in subsequent levels and connect them
    let remainingJobs = [...dependentJobs];
    let processedIds = rootJobs.map(job => job.JOBSCHID.toString());
    
    while (remainingJobs.length > 0 && level < 10) { // Prevent infinite loops
      level++;
      const currentLevelJobs = remainingJobs.filter(job => 
        processedIds.includes(job.DPND_JOBSCHID.toString())
      );
      
      if (currentLevelJobs.length === 0) break; // No more dependencies can be resolved
      
      currentLevelJobs.forEach((job, index) => {
        const x = (index % nodesPerRow) * horizontalSpacing;
        const y = level * levelHeight + Math.floor(index / nodesPerRow) * levelHeight;
        
        flowNodes.push({
          id: job.JOBSCHID.toString(),
          type: 'custom',
          position: { x, y },
          data: { 
            job,
            isRoot: false,
            darkMode,
            handleViewDetails
          }
        });
        
        // Add edge from parent to this job
        flowEdges.push({
          id: `e-${job.DPND_JOBSCHID}-${job.JOBSCHID}`,
          source: job.DPND_JOBSCHID.toString(),
          target: job.JOBSCHID.toString(),
          animated: true,
          style: { 
            stroke: darkMode ? '#60A5FA' : '#3B82F6',
            strokeWidth: 2 
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: darkMode ? '#60A5FA' : '#3B82F6',
            width: 15,
            height: 15
          }
        });
      });
      
      // Update processed IDs and remaining jobs
      processedIds = [...processedIds, ...currentLevelJobs.map(job => job.JOBSCHID.toString())];
      remainingJobs = remainingJobs.filter(job => !currentLevelJobs.includes(job));
    }
    
    // If there are still remaining jobs (orphaned jobs with no parent in our list)
    // Place them at the bottom
    if (remainingJobs.length > 0) {
      level++;
      remainingJobs.forEach((job, index) => {
        const x = (index % nodesPerRow) * horizontalSpacing;
        const y = level * levelHeight + Math.floor(index / nodesPerRow) * levelHeight;
        
        flowNodes.push({
          id: job.JOBSCHID.toString(),
          type: 'custom',
          position: { x, y },
          data: { 
            job,
            isRoot: false,
            darkMode,
            handleViewDetails
          }
        });
      });
    }
    
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [jobs, darkMode, handleViewDetails, setNodes, setEdges]);
  
  // Node types registration
  const nodeTypes = {
    custom: CustomNode,
  };
  
  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);
  
  // Function to fit the graph view
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);
  
  // Zoom controls
  const zoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);
  
  const zoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);
  
  // Function to download graph as image
  const downloadImage = useCallback(() => {
    if (flowRef.current) {
      toPng(flowRef.current, {
        quality: 1,
        backgroundColor: darkMode ? '#1A202C' : '#ffffff',
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'job-dependency-graph.png';
          link.click();
        })
        .catch((error) => {
          console.error('Error generating image:', error);
        });
    }
  }, [flowRef, darkMode]);
  
  useEffect(() => {
    // Fit view when nodes are first loaded
    if (nodes.length > 0 && reactFlowInstance) {
      setTimeout(fitView, 100);
    }
  }, [nodes, fitView, reactFlowInstance]);
  
  return (
    <>
      <ReactFlow
        ref={flowRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        style={{ backgroundColor: darkMode ? '#1A202C' : '#F9FAFB' }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        {/* Background pattern */}
        <Background
          gap={24}
          size={1}
          color={darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
          variant="dots"
        />
        
        {/* Controls */}
        <Controls
          showInteractive={false}
          style={{
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        />
        
        {/* Mini map */}
        <MiniMap
          nodeColor={darkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.4)'}
          maskColor={darkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(243, 244, 246, 0.7)'}
          style={{
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        />
        
        {/* Custom control panel */}
        <Panel position="top-right" style={{ marginRight: '10px', marginTop: '10px' }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              bgcolor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              p: 1,
              borderRadius: 2,
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Tooltip title="Fit View">
              <IconButton 
                size="small" 
                onClick={fitView}
                sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  bgcolor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)'
                }}
              >
                <FitScreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom In">
              <IconButton 
                size="small" 
                onClick={zoomIn}
                sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  bgcolor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)'
                }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton 
                size="small" 
                onClick={zoomOut}
                sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  bgcolor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)'
                }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Image">
              <IconButton 
                size="small" 
                onClick={downloadImage}
                sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  bgcolor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)'
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Panel>
      </ReactFlow>
    </>
  );
};

// Wrapper component that provides ReactFlow context
const JobDependencyGraph = (props) => {
  return (
    <Paper
      elevation={props.darkMode ? 2 : 1}
      sx={{
        height: 'calc(100vh - 200px)',
        backgroundColor: props.darkMode ? '#1A202C' : '#F9FAFB',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        border: props.darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
      }}
    >
      <ReactFlowProvider>
        {props.jobs.length > 0 ? (
          <JobDependencyGraphInner {...props} />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: props.darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              padding: 3,
              borderRadius: 2,
              backgroundColor: props.darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              backdropFilter: 'blur(2px)',
              maxWidth: '80%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              No job dependencies to display
            </Typography>
            <Typography variant="body2">
              Either no scheduled jobs exist, or none have dependencies
            </Typography>
          </Box>
        )}
      </ReactFlowProvider>
    </Paper>
  );
};

export default JobDependencyGraph; 