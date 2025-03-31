import React, { useState, useEffect } from 'react';
import { Card, Button, message } from 'antd';
import axios from 'axios';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const LicenseManager = () => {
    const [licenseStatus, setLicenseStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchLicenseStatus = async () => {
        try {
            const response = await axios.get('/api/license/status');
            setLicenseStatus(response.data);
        } catch (error) {
            console.error('Error fetching license status:', error);
            message.error('Failed to fetch license status');
        }
    };

    useEffect(() => {
        fetchLicenseStatus();
    }, []);

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/admin/license/deactivate');
            if (response.data.success) {
                message.success('License deactivated successfully');
                fetchLicenseStatus();
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error deactivating license:', error);
            message.error(error.response?.data?.message || 'Failed to deactivate license');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="License Status" className="mb-4">
            {licenseStatus && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        {licenseStatus.valid ? (
                            <CheckCircleOutlined className="text-2xl text-green-500" />
                        ) : (
                            <ExclamationCircleOutlined className="text-2xl text-red-500" />
                        )}
                        <span className={`text-lg font-medium ${
                            licenseStatus.valid ? 'text-green-700' : 'text-red-700'
                        }`}>
                            {licenseStatus.valid ? 'Application Licensed' : 'Application Not Licensed'}
                        </span>
                    </div>
                    
                    <div className={`p-4 rounded ${
                        licenseStatus.valid 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        <div className="space-y-2">
                            <p className="font-medium">Status: {licenseStatus.status?.toUpperCase()}</p>
                            <p>{licenseStatus.message}</p>
                            {licenseStatus.valid && licenseStatus.expires && (
                                <p>License Expires: {new Date(licenseStatus.expires).toLocaleDateString()}</p>
                            )}
                        </div>
                    </div>

                    {licenseStatus.valid && (
                        <div className="mt-4 pt-4 border-t">
                            <Button
                                danger
                                onClick={handleDeactivate}
                                loading={loading}
                            >
                                Deactivate License
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default LicenseManager; 