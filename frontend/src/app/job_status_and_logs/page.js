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
  Zap
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '../config';

const JobStatusAndLogs = () => {
  const { darkMode } = useTheme();
  const [scheduledJobs, setScheduledJobs] = useState([]);
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
      
      if (data.scheduled_jobs) {
        setScheduledJobs(data.scheduled_jobs);
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

  // Group jobs by job name
  const groupedJobs = useMemo(() => {
    const grouped = {};
    
    scheduledJobs.forEach(job => {
      const [logDate, jobName, status, reqStartDate, actualStartDate, runDuration, errors] = job;
      
      if (!grouped[jobName]) {
        grouped[jobName] = {
          jobName,
          logs: [],
          latestStatus: status,
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          lastRunDate: logDate,
          avgDuration: 0
        };
      }
      
      grouped[jobName].logs.push({
        logDate,
        status,
        reqStartDate,
        actualStartDate,
        runDuration,
        errors
      });
      
      grouped[jobName].totalRuns++;
      if (status === 'SUCCEEDED') grouped[jobName].successfulRuns++;
      if (status === 'FAILED') grouped[jobName].failedRuns++;
      
      // Update latest status if this log is more recent
      if (new Date(logDate) > new Date(grouped[jobName].lastRunDate)) {
        grouped[jobName].latestStatus = status;
        grouped[jobName].lastRunDate = logDate;
      }
    });

    // Calculate average duration for each job
    Object.values(grouped).forEach(job => {
      const validDurations = job.logs
        .map(log => log.runDuration)
        .filter(duration => duration && duration !== 'null');
      
      if (validDurations.length > 0) {
        job.avgDuration = validDurations.reduce((sum, duration) => {
          // Parse duration string like "+00 00:05:23.000000"
          const match = duration.match(/\+\d+ (\d+):(\d+):(\d+)/);
          if (match) {
            const [, hours, minutes, seconds] = match;
            return sum + (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds));
          }
          return sum;
        }, 0) / validDurations.length;
      }
    });

    return Object.values(grouped);
  }, [scheduledJobs]);

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

  // Toggle job expansion
  const toggleJobExpansion = (jobName) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobName)) {
      newExpanded.delete(jobName);
    } else {
      newExpanded.add(jobName);
    }
    setExpandedJobs(newExpanded);
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'SUCCEEDED':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          icon: <CheckCircle size={16} />,
          label: 'Success'
        };
      case 'FAILED':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          icon: <XCircle size={16} />,
          label: 'Failed'
        };
      case 'RUNNING':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icon: <Activity size={16} />,
          label: 'Running'
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

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Statistics
  const stats = useMemo(() => {
    const totalJobs = groupedJobs.length;
    const runningJobs = groupedJobs.filter(job => job.latestStatus === 'RUNNING').length;
    const successfulJobs = groupedJobs.filter(job => job.latestStatus === 'SUCCEEDED').length;
    const failedJobs = groupedJobs.filter(job => job.latestStatus === 'FAILED').length;
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
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
          className="mb-4"
        >
          {/* Filters, Search and Refresh */}
          <div className={`
            p-3 rounded-xl border mb-4
            ${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-200'}
            shadow-sm
          `}>
            <div className="flex flex-col lg:flex-row gap-3 items-center">
              {/* Search */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search by job name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`
                      w-full pl-9 pr-3 py-2 rounded-lg border text-sm
                      ${darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    `}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                {/* Status Filter */}
                <div className="w-full md:w-44">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`
                      w-full px-3 py-2 rounded-lg border text-sm
                      ${darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'}
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    `}
                  >
                    <option value="all">All Statuses</option>
                    <option value="SUCCEEDED">Successful</option>
                    <option value="FAILED">Failed</option>
                    <option value="RUNNING">Running</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="w-full md:w-44">
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
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
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
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={fetchScheduledJobs}
                  disabled={refreshing}
                  className={`
                    flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm w-full md:w-auto
                    ${darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-300/30'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {[
              { 
                label: 'Total Jobs', 
                value: stats.totalJobs, 
                icon: <Database size={18} />, 
                color: 'blue',
                gradient: darkMode ? 'from-blue-900/40 to-indigo-900/30' : 'from-blue-50 to-indigo-100/70'
              },
              { 
                label: 'Running', 
                value: stats.runningJobs, 
                icon: <Activity size={18} />, 
                color: 'blue',
                gradient: darkMode ? 'from-blue-900/40 to-indigo-900/30' : 'from-blue-50 to-indigo-100/70'
              },
              { 
                label: 'Successful', 
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
                  p-3 rounded-xl border bg-gradient-to-br ${stat.gradient}
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
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`
                    p-2 rounded-lg
                    ${stat.color === 'blue' ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : ''}
                    ${stat.color === 'green' ? 'bg-green-100/80 text-green-600 dark:bg-green-900/40 dark:text-green-400' : ''}
                    ${stat.color === 'red' ? 'bg-red-100/80 text-red-600 dark:bg-red-900/40 dark:text-red-400' : ''}
                    ${stat.color === 'purple' ? 'bg-purple-100/80 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : ''}
                  `}>
                    {stat.icon}
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
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Job Details
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Statistics
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Last Run
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
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
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`w-5 h-5 flex items-center justify-center rounded-full ${
                                  isExpanded 
                                    ? darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600' 
                                    : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                <ChevronRight size={14} />
                              </motion.div>
                              <div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {job.jobName}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {job.totalRuns} total runs
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`
                              inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${statusDisplay.bgColor} ${statusDisplay.color}
                            `}>
                              {statusDisplay.icon}
                              <span>{statusDisplay.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
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
                                <Timer size={14} className="text-blue-500" />
                                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {formatDuration(job.avgDuration)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {formatDate(job.lastRunDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`
                                  p-1 rounded-md transition-colors
                                  ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
                                `}
                                title="View Details"
                              >
                                <Eye size={15} />
                              </motion.button>
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
                              <td colSpan={5} className={`px-4 py-0 ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50/70'}`}>
                                <div className="py-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      <span className="flex items-center">
                                        <Activity size={14} className={`mr-1.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                        Execution History
                                      </span>
                                    </h4>
                                    <div className="flex items-center">
                                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {job.logs.length} log entries
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                    {job.logs.map((log, logIndex) => {
                                      const logStatusDisplay = getStatusDisplay(log.status);
                                      return (
                                        <motion.div
                                          key={logIndex}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: logIndex * 0.05 }}
                                          className={`
                                            p-2 rounded-lg border
                                            ${darkMode 
                                              ? 'bg-gray-800/90 border-gray-700 hover:bg-gray-800' 
                                              : 'bg-white border-gray-200 hover:bg-gray-50/80'}
                                            transition-colors
                                          `}
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <span className={`
                                                inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium
                                                ${logStatusDisplay.bgColor} ${logStatusDisplay.color}
                                              `}>
                                                {logStatusDisplay.icon}
                                                <span>{logStatusDisplay.label}</span>
                                              </span>
                                              <div className={`text-xs flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Calendar size={11} className="mr-1" />
                                                {formatDate(log.logDate)}
                                              </div>
                                              {log.runDuration && (
                                                <div className={`text-xs flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  <Clock size={11} className="mr-1" />
                                                  {log.runDuration}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-2 ml-auto">
                                              {log.errors && log.errors !== 'null' && (
                                                <motion.button
                                                  whileHover={{ scale: 1.03 }}
                                                  whileTap={{ scale: 0.97 }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedError(log.errors);
                                                    setErrorDialogOpen(true);
                                                  }}
                                                  className={`
                                                    flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium
                                                    bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400
                                                    hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors
                                                  `}
                                                >
                                                  <AlertTriangle size={10} />
                                                  <span>View Error</span>
                                                </motion.button>
                                              )}
                                              <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  copyToClipboard(JSON.stringify(log, null, 2));
                                                }}
                                                className={`
                                                  p-1 rounded-md transition-colors
                                                  ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
                                                `}
                                                title="Copy Log Details"
                                              >
                                                <Copy size={12} />
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
            <div className="text-center py-12">
              <Database size={48} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'} opacity-70`} />
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No jobs found
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </motion.div>

        {/* Error Dialog */}
        <AnimatePresence>
          {errorDialogOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setErrorDialogOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`
                  max-w-4xl w-full max-h-[85vh] rounded-xl border
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                  shadow-xl overflow-hidden
                `}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-full ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
                        <AlertTriangle size={16} />
                      </div>
                      <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Error Details
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const errorText = encodeURIComponent(selectedError);
                          window.open(`https://chat.openai.com/chat?q=${errorText}`, '_blank');
                        }}
                        className={`
                          flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium
                          ${darkMode 
                            ? 'bg-green-800/70 hover:bg-green-700/80 text-green-300' 
                            : 'bg-green-100 hover:bg-green-200 text-green-700'}
                          transition-colors
                        `}
                      >
                        <Zap size={12} />
                        <span>Ask ChatGPT</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(selectedError);
                        }}
                        className={`
                          flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium
                          ${darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                          transition-colors
                        `}
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setErrorDialogOpen(false)}
                        className={`
                          p-1 rounded-md transition-colors
                          ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
                        `}
                      >
                        <XCircle size={16} />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <pre className={`
                    text-xs whitespace-pre-wrap break-words p-3 rounded-lg
                    ${darkMode 
                      ? 'bg-gray-900/60 text-gray-300 border border-gray-700' 
                      : 'bg-gray-50 text-gray-700 border border-gray-200'}
                  `}>
                    {selectedError}
                  </pre>
                </div>
                
                <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setErrorDialogOpen(false)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium
                        ${darkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                        transition-colors
                      `}
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobStatusAndLogs;
