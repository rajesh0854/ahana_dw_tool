import React, { useState, useEffect } from 'react'
import { Card, Button, message, Spin } from 'antd'
import axios from 'axios'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useTheme } from '../../../context/ThemeContext'

const LicenseManager = () => {
  const [licenseStatus, setLicenseStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { darkMode } = useTheme()

  const fetchLicenseStatus = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/license/status`,
        {
          withCredentials: true,
        }
      )
      console.log(response.data)        
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get license status')
      }

      setLicenseStatus(response.data.data)
    } catch (error) {
      console.error('Error fetching license status:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch license status'
      message.error(errorMessage)
      setLicenseStatus({
        valid: false,
        message: errorMessage,
        error: error.response?.data?.error || 'License status fetch failed',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLicenseStatus()
  }, [])

  const handleActivateLicense = async (licenseKey) => {
    try {
      setLoading(true)
      const response = await axios.post('/api/admin/license/activate', {
        license_key: licenseKey,
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to activate license')
      }

      message.success(response.data.message)
      await fetchLicenseStatus()
    } catch (error) {
      console.error('Error activating license:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to activate license'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivateLicense = async () => {
    try {
      setLoading(true)
      const response = await axios.post('/api/admin/license/deactivate')

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate license')
      }

      message.success(response.data.message)
      await fetchLicenseStatus()
    } catch (error) {
      console.error('Error deactivating license:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to deactivate license'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined className={`text-base ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-base font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            License Management
          </span>
        </div>
      } 
      className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      headStyle={{ 
        padding: '14px 18px',
        borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        backgroundColor: darkMode ? '#1f2937' : '#f9fafb'
      }}
      bodyStyle={{ 
        padding: '18px',
        backgroundColor: darkMode ? '#111827' : 'white'
      }}
    >
      {loading && !licenseStatus ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : licenseStatus && (
        <div className="space-y-4">
          <div className={`flex items-center p-3 rounded-md ${
            darkMode 
              ? (licenseStatus.valid ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800')
              : (licenseStatus.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')
          }`}>
            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-3 ${
              licenseStatus.valid 
                ? (darkMode ? 'bg-green-800/70 text-green-300' : 'bg-green-100 text-green-600') 
                : (darkMode ? 'bg-red-800/70 text-red-300' : 'bg-red-100 text-red-600')
            }`}>
              {licenseStatus.valid ? (
                <CheckCircleOutlined className="text-xl" />
              ) : (
                <ExclamationCircleOutlined className="text-xl" />
              )}
            </div>
            <div>
              <p className={`font-medium ${
                licenseStatus.valid 
                  ? (darkMode ? 'text-green-300' : 'text-green-700')
                  : (darkMode ? 'text-red-300' : 'text-red-700')
              }`}>
                {licenseStatus.valid ? 'Application Licensed' : 'Application Not Licensed'}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Status: <span className="font-medium">{licenseStatus.status?.toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-md border ${
            darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="space-y-2">
              <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>License Details</h4>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {licenseStatus.message}
              </p>
              {licenseStatus.valid && licenseStatus.expires && (
                <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-medium mr-1">Expires:</span>
                  {new Date(licenseStatus.expires).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {licenseStatus.valid && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button
                type="primary" 
                danger
                onClick={handleDeactivateLicense}
                loading={loading}
                icon={<CloseCircleOutlined />}
                className={darkMode ? 'bg-red-600 hover:bg-red-700 border-red-700' : ''}
              >
                Deactivate License
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default LicenseManager
