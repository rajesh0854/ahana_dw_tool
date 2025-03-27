"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import MappingDetailsDialog from '../../components/MappingDetailsDialog';

// Create Axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mappingData, setMappingData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);

  // Fetch jobs list on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/job/jobs_list');
        setJobs(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Handle row click to open mapping details
  const handleRowClick = async (job) => {
    try {
      setSelectedJob(job);
      setOpenDialog(true);
      setMappingLoading(true);
      
      const response = await api.get(`/job/view_mapping/${job.MAPREF}`);
      setMappingData(response.data);
    } catch (err) {
      console.error('Error fetching mapping details:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setMappingLoading(false);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMappingData(null);
  };

  // Format date strings for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] p-6">
      <div className="max-w-8xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Jobs List</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <span className="block sm:inline">Error: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Map ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Map Reference</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source System</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Schema</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Table Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Table Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Flag</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Flag</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Process Rows</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr 
                    key={job.JOBID} 
                    onClick={() => handleRowClick(job)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{job.JOBID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.MAPID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.MAPREF}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.SRCSYSTM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.TRGSCHM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.TRGTBNM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.TRGTBTYP}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.FRQCD}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.STFLG}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.CURFLG}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{job.BLKPRCROWS}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(job.RECCRDT)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(job.RECUPDT)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <MappingDetailsDialog 
          open={openDialog}
          onClose={handleCloseDialog}
          selectedJob={selectedJob}
          mappingData={mappingData}
          mappingLoading={mappingLoading}
        />
      </div>
    </div>
  );
}