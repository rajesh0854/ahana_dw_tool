'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '../config';
import MetricsCards from './MetricsCards';
import JobsOverviewTable from './JobsOverviewTable';
import JobsProcessedRowsChart from './JobsProcessedRowsChart';
import JobsExecutionDurationChart from './JobsExecutionDurationChart';
import JobsAverageRunDurationChart from './JobsAverageRunDurationChart';
import JobsSuccessFailChart from './JobsSuccessFailChart';

export default function Dashboard() {
  const [jobsList, setJobsList] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchJobsOverview();
  }, []);

  const fetchJobsOverview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/jobs_overview`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const jobs = data.map(job => job[0]); // Extract mapref (first column)
        setJobsList(jobs);
        setSelectedJob(jobs[0]); // Set first job as default
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs overview:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-32 w-32 border-b-2 mx-auto ${
            darkMode ? 'border-blue-400' : 'border-blue-600'
          }`}></div>
          <p className={`mt-4 text-lg ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Main Content */}
      <div className="max-w-full px-6 py-6 space-y-6">
        {/* Metrics Cards */}
        <MetricsCards />

        {/* Jobs Overview Table */}
        <JobsOverviewTable />

        {/* Job Selector for Specific Charts */}
        {jobsList.length > 0 && (
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Job-Specific Analytics</h3>
                <p className={`mt-1 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Select a job to view detailed processed rows and execution duration metrics
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 sm:ml-6">
                <label htmlFor="job-select" className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Job
                </label>
                <select
                  id="job-select"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className={`block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  {jobsList.map((job) => (
                    <option key={job} value={job}>
                      {job}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Charts Grid for Job-Specific Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Jobs Processed Rows Chart */}
              <JobsProcessedRowsChart selectedJob={selectedJob} />

              {/* Jobs Execution Duration Chart */}
              <JobsExecutionDurationChart selectedJob={selectedJob} />
            </div>
          </div>
        )}

        {/* General Analytics Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Jobs Average Run Duration Chart */}
          <JobsAverageRunDurationChart />

          {/* Jobs Success/Fail Chart */}
          <JobsSuccessFailChart />
        </div>
      </div>
    </div>
  );
}
