'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Copy, 
  Download,
  ChevronDown,
  ChevronRight,
  Activity,
  Database,
  Timer,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Zap,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '../config';
import ErrorDetailsDialog from './ErrorDetailsDialog';

const JobStatusAndLogs = () => {
  const { darkMode } = useTheme();
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [columnNames, setColumnNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedJobs, setExpandedJobs] = useState(new Set());
  const [selectedError, setSelectedError] = useState(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('log_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch scheduled jobs data
  const fetchScheduledJobs = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/job/get_scheduled_jobs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.scheduled_jobs && data.column_names) {
        // Use column names from the backend to map data
        setColumnNames(data.column_names.map(name => name.toLowerCase()));
        setScheduledJobs(data.scheduled_jobs);
        // Set default sort to lastRunDate in descending order
        setSortBy('lastRunDate');
        setSortOrder('desc');
      } else if (data.error) {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScheduledJobs();
  }, []);

  // Process raw job data into an array of objects
  const processedJobs = useMemo(() => {
    if (columnNames.length === 0 || scheduledJobs.length === 0) {
      return [];
    }
    const processed = scheduledJobs.map(row => {
      const jobObject = {};
      columnNames.forEach((colName, index) => {
        jobObject[colName] = row[index];
      });
      return jobObject;
    });
    

    
    return processed;
  }, [scheduledJobs, columnNames]);

  // Group jobs by job name
  const groupedJobs = useMemo(() => {
    const grouped = {};
    
    processedJobs.forEach((job) => {
      // Destructure using column names from the backend
      const { 
        log_id: logId,
        job_id: jobId, 
        log_date: logDate, 
        job_name: jobName, 
        status, 
        actual_start_date: actualStartDate, 
        error_message: errorMessage, 
        run_duration_seconds: runDurationSeconds, 
        session_id: sessionId 
      } = job;
      

      
      // Ensure we have valid data
      if (!jobName || !logId) {
        return;
      }
      
      if (!grouped[jobName]) {
        grouped[jobName] = {
          jobName,
          logs: [],
          latestStatus: status,
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          inProgressRuns: 0,
          lastRunDate: logDate,
          avgDuration: 0,
          hasFailedLogs: false
        };
      }
      
      grouped[jobName].logs.push({
        logId,
        jobId,
        logDate,
        status,
        actualStartDate,
        errorMessage,
        runDurationSeconds,
        sessionId
      });
      
      grouped[jobName].totalRuns++;
      if (status === 'PC') grouped[jobName].successfulRuns++;
      if (status === 'FL') {
        grouped[jobName].failedRuns++;
        grouped[jobName].hasFailedLogs = true;
      }
      if (status === 'IP') grouped[jobName].inProgressRuns++;
      
      // This is now handled after grouping and sorting logs
    });

    // Calculate average duration and set latest status for each job
    Object.values(grouped).forEach(job => {
      // Sort logs by date in descending order (newest first)
      job.logs.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
      
      // Ensure latestStatus is from the most recent log
      if (job.logs.length > 0) {
        job.latestStatus = job.logs[0].status;
        job.lastRunDate = job.logs[0].logDate;
      }
      
      const validDurations = job.logs
        .map(log => log.runDurationSeconds)
        .filter(duration => duration && duration !== null && !isNaN(duration));
      
      if (validDurations.length > 0) {
        job.avgDuration = validDurations.reduce((sum, duration) => sum + parseFloat(duration), 0) / validDurations.length;
      }
    });

    return Object.values(grouped);
  }, [processedJobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = groupedJobs.filter(job => {
      const matchesSearch = job.jobName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.latestStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'lastRunDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [groupedJobs, searchTerm, statusFilter, sortBy, sortOrder]);

  // Toggle job expansion (auto-close others)
  const toggleJobExpansion = (jobName) => {
    const newExpanded = new Set();
    if (!expandedJobs.has(jobName)) {
      // Only add the current job (closes all others)
      newExpanded.add(jobName);
    }
    // If the job was already expanded, newExpanded remains empty (closes all)
    setExpandedJobs(newExpanded);
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PC':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          icon: <CheckCircle size={16} />,
          label: 'Process Complete'
        };
      case 'FL':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          icon: <XCircle size={16} />,
          label: 'Failed'
        };
      case 'IP':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icon: <Activity size={16} />,
          label: 'In Progress'
        };
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          icon: <Clock size={16} />,
          label: status || 'Unknown'
        };
    }
  };

  // Format duration from seconds
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return 'N/A';
    const totalSeconds = parseInt(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Handle error dialog for failed jobs
  const handleViewError = (jobName, logId) => {
    const job = groupedJobs.find(j => j.jobName === jobName);
    if (!job) return;
    
    // Find all logs with the matching logId
    const matchingLogs = job.logs.filter(l => l.logId === logId);
    
    // Prioritize logs with meaningful error messages
    let log = matchingLogs.find(l => l.errorMessage && l.errorMessage.trim() !== '');
    
    // If no log with meaningful error message, use the first one
    if (!log) {
      log = matchingLogs[0];
    }
    
    if (!log) return;
    
    const errorDetails = [];
    
    // Check if error message exists and is not just whitespace/newlines
    const hasValidErrorMessage = log.errorMessage && log.errorMessage.trim() !== '';
    
    // Always create an error detail entry for failed jobs, even if no specific error message
    const errorMessage = hasValidErrorMessage ? log.errorMessage : 'Job failed but no specific error message was recorded.';
    
    errorDetails.push({
      ERROR_ID: logId,
      ERROR_TYPE: 'Job Execution Error',
      PROCESS_DATE: log.actualStartDate || log.logDate,
      KEY_VALUE: jobName,
      ERROR_MESSAGE: errorMessage,
    });
    
    setSelectedError({
      jobName,
      logId,
      errorDetails
    });
    setErrorDialogOpen(true);
  };

  // Statistics
  const stats = useMemo(() => {
    const totalJobs = groupedJobs.length;
    const runningJobs = groupedJobs.filter(job => job.latestStatus === 'IP').length;
    const successfulJobs = groupedJobs.filter(job => job.latestStatus === 'PC').length;
    const failedJobs = groupedJobs.filter(job => job.latestStatus === 'FL').length;
    const totalRuns = groupedJobs.reduce((sum, job) => sum + job.totalRuns, 0);
    
    return { totalJobs, runningJobs, successfulJobs, failedJobs, totalRuns };
  }, [groupedJobs]);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full`}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-2`}>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.5)'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? 'rgba(75, 85, 99, 0.8)' : 'rgba(209, 213, 219, 0.8)'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? 'rgba(107, 114, 128, 0.8)' : 'rgba(156, 163, 175, 0.8)'};
        }
      `}</style>
      <div className="max-w-full mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-2"
        >

          {/* Filters, Search and Refresh */}
          <div className={`
            p-2 rounded-lg border mb-2
            ${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-200'}
            shadow-sm
          `}>
            <div className="flex flex-col lg:flex-row gap-3 items-center">
              {/* Search */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search by job name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`
                      w-full pl-10 pr-4 py-2 rounded-lg border text-sm
                      ${darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                    `}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
                {/* Status Filter */}
                <div className="w-full md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`
                      w-full px-3 py-2 rounded-lg border text-sm
                      ${darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'}
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                    `}
                  >
                    <option value="all">All Statuses</option>
                    <option value="PC">Process Complete</option>
                    <option value="FL">Failed</option>
                    <option value="IP">In Progress</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="w-full md:w-48">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className={`
                      w-full px-3 py-2 rounded-lg border text-sm
                      ${darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'}
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                    `}
                  >
                    <option value="lastRunDate-desc">Latest First</option>
                    <option value="lastRunDate-asc">Oldest First</option>
                    <option value="jobName-asc">Name A-Z</option>
                    <option value="jobName-desc">Name Z-A</option>
                    <option value="totalRuns-desc">Most Runs</option>
                    <option value="successfulRuns-desc">Most Successful</option>
                  </select>
                </div>
                
                {/* Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchScheduledJobs}
                  disabled={refreshing}
                  className={`
                    flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm w-full md:w-auto
                    ${darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-300/30'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
            {[
              { 
                label: 'Total Jobs', 
                value: stats.totalJobs, 
                icon: <Database size={18} />, 
                color: 'blue',
                gradient: darkMode ? 'from-blue-900/40 to-indigo-900/30' : 'from-blue-50 to-indigo-100/70'
              },
              { 
                label: 'In Progress', 
                value: stats.runningJobs, 
                icon: <PlayCircle size={18} />, 
                color: 'blue',
                gradient: darkMode ? 'from-blue-900/40 to-indigo-900/30' : 'from-blue-50 to-indigo-100/70'
              },
              { 
                label: 'Completed', 
                value: stats.successfulJobs, 
                icon: <CheckCircle size={18} />, 
                color: 'green',
                gradient: darkMode ? 'from-green-900/40 to-emerald-900/30' : 'from-green-50 to-emerald-100/70'
              },
              { 
                label: 'Failed', 
                value: stats.failedJobs, 
                icon: <XCircle size={18} />, 
                color: 'red',
                gradient: darkMode ? 'from-red-900/40 to-rose-900/30' : 'from-red-50 to-rose-100/70'
              },
              { 
                label: 'Total Runs', 
                value: stats.totalRuns, 
                icon: <BarChart3 size={18} />, 
                color: 'purple',
                gradient: darkMode ? 'from-purple-900/40 to-violet-900/30' : 'from-purple-50 to-violet-100/70'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-2 rounded-md border bg-gradient-to-br ${stat.gradient}
                  ${darkMode 
                    ? 'border-gray-700' 
                    : 'border-gray-200'}
                  shadow-sm hover:shadow-md transition-all
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {stat.label}
                    </p>
                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-0.5`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`
                    p-1 rounded
                    ${stat.color === 'blue' ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : ''}
                    ${stat.color === 'green' ? 'bg-green-100/80 text-green-600 dark:bg-green-900/40 dark:text-green-400' : ''}
                    ${stat.color === 'red' ? 'bg-red-100/80 text-red-600 dark:bg-red-900/40 dark:text-red-400' : ''}
                    ${stat.color === 'purple' ? 'bg-purple-100/80 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : ''}
                  `}>
                    <div className="w-4 h-4">{stat.icon}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Jobs Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`
            rounded-xl border overflow-hidden
            ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}
            shadow-sm
          `}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700/80' : 'bg-gray-50/90'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Job Details
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Statistics
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Last Run
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <AnimatePresence>
                  {filteredJobs.map((job, index) => {
                    const statusDisplay = getStatusDisplay(job.latestStatus);
                    const isExpanded = expandedJobs.has(job.jobName);
                    
                    return (
                      <React.Fragment key={job.jobName}>
                        <motion.tr
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            hover:bg-opacity-50 transition-colors cursor-pointer
                            ${darkMode ? 'hover:bg-gray-700/70' : 'hover:bg-gray-50/90'}
                          `}
                          onClick={() => toggleJobExpansion(job.jobName)}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center space-x-3">
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`w-6 h-6 flex items-center justify-center rounded-full ${
                                  isExpanded 
                                    ? darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600' 
                                    : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                <ChevronRight size={16} />
                              </motion.div>
                              <div className="flex items-center">
                                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {job.jobName}
                                </div>
                                <div className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ({job.totalRuns} runs)
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`
                              inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium
                              ${statusDisplay.bgColor} ${statusDisplay.color}
                            `}>
                              {statusDisplay.icon}
                              <span>{statusDisplay.label}</span>
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-1">
                                <CheckCircle size={14} className="text-green-500" />
                                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {job.successfulRuns}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <XCircle size={14} className="text-red-500" />
                                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {job.failedRuns}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <PlayCircle size={14} className="text-blue-500" />
                                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {job.inProgressRuns}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Timer size={14} className="text-purple-500" />
                                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {formatDuration(job.avgDuration)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {formatDate(job.lastRunDate)}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center space-x-2">
                              {job.latestStatus === 'FL' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Find the most recent log (which should be failed)
                                    const latestLog = job.logs
                                      .sort((a, b) => new Date(b.logDate) - new Date(a.logDate))[0];
                                    handleViewError(job.jobName, latestLog?.logId);
                                  }}
                                  className={`
                                    flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium
                                    bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400
                                    hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors
                                  `}
                                  title="View Error Details"
                                >
                                  <AlertTriangle size={12} />
                                  <span>View Error</span>
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                        
                        {/* Expanded Logs */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td colSpan={5} className={`px-6 py-0 ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50/70'}`}>
                                <div className="py-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      <span className="flex items-center">
                                        <Activity size={16} className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                        Execution History
                                      </span>
                                    </h4>
                                    <div className="flex items-center">
                                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {job.logs.length} log entries
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {job.logs
                                      .sort((a, b) => new Date(b.logDate) - new Date(a.logDate))
                                      .map((log, logIndex) => {
                                      const logStatusDisplay = getStatusDisplay(log.status);
                                      return (
                                        <motion.div
                                          key={`${log.logId}-${logIndex}`}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: logIndex * 0.05 }}
                                          className={`
                                            p-3 rounded-lg border
                                            ${darkMode 
                                              ? 'bg-gray-800/90 border-gray-700 hover:bg-gray-800' 
                                              : 'bg-white border-gray-200 hover:bg-gray-50/80'}
                                            transition-colors
                                          `}
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <span className={`
                                                inline-flex items-center space-x-2 px-3 py-1 rounded-md text-xs font-medium
                                                ${logStatusDisplay.bgColor} ${logStatusDisplay.color}
                                              `}>
                                                {logStatusDisplay.icon}
                                                <span>{logStatusDisplay.label}</span>
                                              </span>
                                              <div className={`text-xs flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Calendar size={12} className="mr-1" />
                                                {formatDate(log.logDate)}
                                              </div>
                                              {log.actualStartDate && (
                                                <div className={`text-xs flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  <PlayCircle size={12} className="mr-1" />
                                                  Started: {formatDate(log.actualStartDate)}
                                                </div>
                                              )}
                                              {log.runDurationSeconds && (
                                                <div className={`text-xs flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  <Clock size={12} className="mr-1" />
                                                  Duration: {formatDuration(log.runDurationSeconds)}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-2 ml-auto">
                                              {log.status === 'FL' && (
                                                <motion.button
                                                  whileHover={{ scale: 1.03 }}
                                                  whileTap={{ scale: 0.97 }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewError(job.jobName, log.logId);
                                                  }}
                                                  className={`
                                                    flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium
                                                    bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400
                                                    hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors
                                                  `}
                                                >
                                                  <AlertTriangle size={12} />
                                                  <span>View Error</span>
                                                </motion.button>
                                              )}
                                              <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  copyToClipboard(JSON.stringify({
                                                    jobName: job.jobName,
                                                    status: log.status,
                                                    logDate: log.logDate,
                                                    actualStartDate: log.actualStartDate,
                                                    duration: formatDuration(log.runDurationSeconds)
                                                  }, null, 2));
                                                }}
                                                className={`
                                                  p-1.5 rounded-md transition-colors
                                                  ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
                                                `}
                                                title="Copy Log Details"
                                              >
                                                <Copy size={14} />
                                              </motion.button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <Database size={64} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'} opacity-70`} />
              <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No jobs found
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </motion.div>

        {/* Error Dialog */}
        <ErrorDetailsDialog
          open={errorDialogOpen}
          onClose={() => setErrorDialogOpen(false)}
          errorDetails={selectedError?.errorDetails || []}
          jobId={selectedError?.logId || selectedError?.jobName}
          loading={false}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default JobStatusAndLogs;
