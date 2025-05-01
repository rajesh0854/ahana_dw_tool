'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Button,
  TextField,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  alpha,
  Tooltip,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  useMediaQuery,
  CircularProgress,
  FormHelperText,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  RestartAlt as ResetIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  VpnKey as VpnKeyIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { message } from 'antd';
import LicenseManager from './components/LicenseManager';
import { AboutTabContent } from './components';

const mockRoles = [
  { id: 1, name: 'Admin', permissions: ['all'], userCount: 5, description: 'Full system access' },
  { id: 2, name: 'User', permissions: ['read', 'write'], userCount: 15, description: 'Basic access rights' },
  { id: 3, name: 'Manager', permissions: ['read', 'write', 'approve'], userCount: 8, description: 'Department level access' },
];

const mockAuditLogs = [
  { id: 1, user: 'John Doe', action: 'User Created', timestamp: '2024-03-26 10:30:00', details: 'Created user: jane@example.com', type: 'create' },
  { id: 2, user: 'Jane Smith', action: 'Profile Updated', timestamp: '2024-03-26 11:15:00', details: 'Updated role from User to Manager', type: 'update' },
  { id: 3, user: 'Admin', action: 'User Deleted', timestamp: '2024-03-26 12:00:00', details: 'Deleted user: old_user@example.com', type: 'delete' },
];

// Add these animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Memoize the StatCard component to prevent unnecessary re-renders
const StatCard = memo(({ title, value, icon, color, trend }) => {
  // Add useTheme hook to access the theme
  const theme = useTheme();
  
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      sx={{
        height: '100%',
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, py: 0.5, px: 1, '&:last-child': { pb: 0.5 } }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              backgroundColor: alpha(color, 0.1),
              color: color,
              borderRadius: '6px',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" fontWeight="medium" sx={{ opacity: 0.7, fontSize: '0.65rem', display: 'block', mb: 0.25 }}>
              {title}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.75}>
              <Typography variant="body2" sx={{ fontWeight: '600', letterSpacing: '-0.3px' }}>
                {value}
              </Typography>
              {trend && (
                <Box 
                  display="flex" 
                  alignItems="center" 
                  sx={{ 
                    backgroundColor: alpha(theme.palette.success.main, 0.08),
                    borderRadius: '4px',
                    px: 0.5,
                    py: 0.25,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 10, mr: 0.25, color: theme.palette.success.main }} />
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: theme.palette.success.main }}>
                    {trend}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Add this utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    is_active: true
  });
  const [roleFormData, setRoleFormData] = useState({
    role_name: '',
    description: '',
    is_system_role: false,
    permissions: {
      usermanagement: {
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      }
    }
  });
  const { user, loading, handleTokenExpiration } = useAuth();
  const router = useRouter();

  // Add these states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Add these states to your component for Audit Logs filtering and pagination
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const [auditLogsPerPage, setAuditLogsPerPage] = useState(10);
  const [auditLogsSearchTerm, setAuditLogsSearchTerm] = useState('');
  const [auditLogsDateFilter, setAuditLogsDateFilter] = useState('');
  const [auditLogsStatusFilter, setAuditLogsStatusFilter] = useState('all');

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []); // Data loading is handled by the useEffect hook above

  const handleOpenDialog = (type, data = null) => {
    if (type === 'editUser') {
      setSelectedUser(data);
      setFormData({
        username: data?.username || '',
        email: data?.email || '',
        is_active: data?.is_active || true,
      });
    } else if (type === 'editRole') {
      setSelectedRole(data);
      setRoleFormData({
        role_name: data?.role_name || '',
        description: data?.description || '',
        permissions: data?.permissions || {},
      });
    } else if (type === 'newRole') {
      setRoleFormData({
        role_name: '',
        description: '',
        permissions: {},
      });
    } else if (type === 'newUser') {
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'user',
        is_active: true,
      });
    }
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setSelectedRole(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'user',
      is_active: true,
    });
    setRoleFormData({
      role_name: '',
      description: '',
      permissions: {},
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApiError = async (response) => {
    if (response.status === 401) {
      const data = await response.json();
      if (data.error === 'Token has expired') {
        handleTokenExpiration();
      } else {
        message.error('Session expired. Please login again.');
        router.push('/auth/login');
      }
      return true;
    }
    return false;
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/admin/roles`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setRoles(response.data);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error loading roles');
    }
  };

  const createRole = async (roleData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/admin/roles`, roleData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        message.success('Role created successfully');
        loadRoles();
        handleCloseDialog();
      } else {
        message.error('Failed to create role');
      }
    } catch (err) {
      console.error('Error creating role:', err);
      const errorMessage = err.response?.data?.error || 'Error creating role';
      message.error(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        message.warning('A role with this name already exists. Please choose a different name.');
      }
    }
  };

  const updateRole = async (roleId, roleData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/admin/roles/${roleId}`, roleData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      message.success('Role updated successfully');
      loadRoles();
      handleCloseDialog();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error updating role';
      message.error(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes('Cannot modify system roles')) {
        message.warning('System roles cannot be modified.');
      } else if (errorMessage.includes('already exists')) {
        message.warning('A role with this name already exists. Please choose a different name.');
      }
    }
  };

  const deleteRole = async (roleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.delete(`${API_BASE_URL}/admin/roles/${roleId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      message.success('Role deleted successfully');
      loadRoles();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting role';
      message.error(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes('Cannot delete system roles')) {
        message.warning('System roles cannot be deleted.');
      } else if (errorMessage.includes('assigned to users')) {
        message.warning('This role cannot be deleted because it is assigned to users. Please reassign or remove users from this role first.');
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading) {
      loadUsers();
      loadRoles();
      loadPendingApprovals();
      if (activeTab === 2) {
        loadAuditLogs();
      }
    }
  }, [loading, user, activeTab]);

  const loadUsers = async () => {
    if (isLoadingUsers) return; // Prevent duplicate calls
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setUsers(response.data);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error loading users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/admin/pending-approvals`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        setPendingApprovals(response.data);
      }
    } catch (err) {
      console.error('Error loading pending approvals:', err);
      message.error(err.response?.data?.error || 'Error loading pending approvals');
    }
  };

  const createUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/admin/users`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        message.success('User created successfully');
        loadUsers();
        loadPendingApprovals();
        handleCloseDialog();
      } else {
        message.error('Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      message.error(err.response?.data?.error || 'Error creating user');
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}`, userData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        message.success('User updated successfully');
        loadUsers();
        handleCloseDialog();
      } else {
        message.error('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage = err.response?.data?.error || 'Error updating user';
      message.error(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        message.warning('A user with this username or email already exists.');
      } else if (errorMessage.includes('not found')) {
        message.error('User not found. Please refresh the page.');
      }
      throw err; // Re-throw to be handled by the form component
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      message.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error deleting user');
    }
  };

  const approveUser = async (userId, actionType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/admin/approve-user/${userId}`,
        { action: actionType },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        message.success(response.data.message);
        // Refresh both users and pending approvals lists
        await Promise.all([
          loadUsers(),
          loadPendingApprovals()
        ]);
      }
    } catch (err) {
      console.error('Error approving user:', err);
      const errorMessage = err.response?.data?.error || 'Error updating approval';
      
      // Handle specific error cases
      if (errorMessage.includes('Creator cannot approve')) {
        message.warning('You cannot approve or reject your own user creation');
      } else if (errorMessage.includes('not found or not in pending status')) {
        message.warning('User not found or not in pending status');
      } else {
        message.error(errorMessage);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    console.log('Input changed:', name, value);
    
    // Handle special cases for different input types
    const newValue = name === 'is_active' ? checked : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    setRoleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (module, permission, checked) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: checked
        }
      }
    }));
  };

  const handleRoleSubmit = () => {
    if (dialogType === 'newRole') {
      createRole(roleFormData);
    } else if (dialogType === 'editRole') {
      updateRole(selectedRole.role_id, roleFormData);
    }
  };

  const UserDialog = () => {
    
    
    if (dialogType === 'newUser') {
      return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Username"
            name="username"
            fullWidth
            value={formData.username || ''}
            onChange={handleInputChange}
            variant="outlined"
            autoComplete="off"
            InputProps={{
              sx: {
                borderRadius: 2,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <TextField
            label="Email"
            name="email"
            fullWidth
            value={formData.email || ''}
            onChange={handleInputChange}
            variant="outlined"
            autoComplete="off"
            InputProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            fullWidth
            value={formData.password || ''}
            onChange={handleInputChange}
            variant="outlined"
            autoComplete="new-password"
            InputProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="First Name"
            name="first_name"
            fullWidth
            value={formData.first_name || ''}
            onChange={handleInputChange}
            variant="outlined"
            autoComplete="off"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <TextField
            label="Last Name"
            name="last_name"
            fullWidth
            value={formData.last_name || ''}
            onChange={handleInputChange}
            variant="outlined"
            autoComplete="off"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              name="role"
              value={formData.role || 'user'}
              onChange={handleInputChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  name="is_active"
                  checked={Boolean(formData.is_active)}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body1" color="textPrimary">
                  Active Status
                </Typography>
              }
            />
          </FormGroup>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Username"
          name="username"
          fullWidth
          value={formData.username || ''}
          onChange={handleInputChange}
          variant="outlined"
          autoComplete="off"
          InputProps={{
            sx: {
              borderRadius: 2,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />
        <TextField
          label="Email"
          name="email"
          fullWidth
          value={formData.email || ''}
          onChange={handleInputChange}
          variant="outlined"
          autoComplete="off"
          InputProps={{
            sx: {
              borderRadius: 2,
            },
          }}
        />
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                name="is_active"
                checked={Boolean(formData.is_active)}
                onChange={handleInputChange}
                color="primary"
              />
            }
            label={
              <Typography variant="body1" color="textPrimary">
                Active Status
              </Typography>
            }
          />
        </FormGroup>
      </Box>
    );
  };

  const RoleDialog = () => {
    const theme = useTheme();
    const [formState, setFormState] = useState({
      values: {
        role_name: '',
        description: '',
        is_system_role: false,
        permissions: {
          usermanagement: {
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false
          }
        }
      },
      touched: {},
      errors: {},
      isSubmitting: false
    });

    useEffect(() => {
      if (dialogType === 'editRole' && selectedRole) {
        setFormState(prev => ({
          ...prev,
          values: {
            role_name: selectedRole.role_name || '',
            description: selectedRole.description || '',
            is_system_role: selectedRole.is_system_role || false,
            permissions: selectedRole.permissions || {
              usermanagement: {
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false
              }
            }
          }
        }));
      }
    }, [dialogType, selectedRole]);

    const handleChange = (e) => {
      const { name, value, checked } = e.target;
      const newValue = name === 'is_system_role' ? checked : value;

      setFormState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [name]: newValue
        }
      }));
    };

    const handleSubmit = async () => {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('Authentication required');
          router.push('/auth/login');
          return;
        }

        // Prepare the data to send to the backend
        const roleData = {
          role_name: formState.values.role_name.trim(),
          description: formState.values.description.trim(),
          is_system_role: formState.values.is_system_role || false,
          permissions: formState.values.permissions || {
            usermanagement: {
              can_view: false,
              can_create: false,
              can_edit: false,
              can_delete: false
            }
          }
        };

        if (dialogType === 'newRole') {
          const response = await axios.post(`${API_BASE_URL}/admin/roles`, roleData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.status === 201) {
            message.success('Role created successfully');
            loadRoles();
            handleCloseDialog();
          }
        } else if (dialogType === 'editRole') {
          const response = await axios.put(`${API_BASE_URL}/admin/roles/${selectedRole.role_id}`, roleData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          message.success('Role updated successfully');
          loadRoles();
          handleCloseDialog();
        }
      } catch (error) {
        console.error('Error submitting role:', error);
        const errorMessage = error.response?.data?.error || 'Error submitting role';
        message.error(errorMessage);
        
        // Handle specific error cases
        if (errorMessage.includes('already exists')) {
          message.warning('A role with this name already exists. Please choose a different name.');
        }
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    };

    return (
      <>
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTypography-root': {
              fontSize: '1.1rem',
              fontWeight: 600,
            },
          }}
        >
          {dialogType === 'newRole' ? 'Add New Role' : 'Edit Role'}
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              name="role_name"
              fullWidth
              size="small"
              value={formState.values.role_name}
              onChange={handleChange}
              variant="outlined"
              disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={formState.values.description}
              onChange={handleChange}
              variant="outlined"
              disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    name="is_system_role"
                    checked={formState.values.is_system_role}
                    onChange={handleChange}
                    color="primary"
                    size="small"
                    disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
                  />
                }
                label={
                  <Typography variant="body2" color="textPrimary">
                    System Role
                  </Typography>
                }
              />
            </FormGroup>
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="600" color="primary" gutterBottom sx={{ fontSize: '0.8rem' }}>
                User Management Permissions
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                }}
              >
                <Grid container spacing={1.5}>
                  {[
                    { key: 'can_view', label: 'View' },
                    { key: 'can_create', label: 'Create' },
                    { key: 'can_edit', label: 'Edit' },
                    { key: 'can_delete', label: 'Delete' }
                  ].map((permission) => (
                    <Grid item xs={6} key={permission.key}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formState.values.permissions.usermanagement[permission.key]}
                            onChange={(e) => {
                              setFormState(prev => ({
                                ...prev,
                                values: {
                                  ...prev.values,
                                  permissions: {
                                    ...prev.values.permissions,
                                    usermanagement: {
                                      ...prev.values.permissions.usermanagement,
                                      [permission.key]: e.target.checked
                                    }
                                  }
                                }
                              }));
                            }}
                            color="primary"
                            size="small"
                            disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{permission.label}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            disabled={formState.isSubmitting}
            size="small"
            sx={{
              borderRadius: 1.5,
              borderWidth: 1,
              fontSize: '0.8rem',
              py: 0.5,
              '&:hover': {
                borderWidth: 1,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={formState.isSubmitting || (dialogType === 'editRole' && selectedRole?.is_system_role)}
            size="small"
            sx={{
              borderRadius: 1.5,
              boxShadow: theme.shadows[2],
              fontSize: '0.8rem',
              py: 0.5,
              '&:hover': {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            {formState.isSubmitting ? 'Saving...' : dialogType === 'newRole' ? 'Create' : 'Save Changes'}
          </Button>
        </DialogActions>
      </>
    );
  };

  // Create User Form Component
  const CreateUserForm = ({ onCancel }) => {
    const theme = useTheme();
    const [formState, setFormState] = useState({
      values: {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '',
        is_active: true
      },
      touched: {},
      errors: {},
      isSubmitting: false
    });

    // Handle input changes for all form fields
    const handleChange = (e) => {
      const { name, value, checked } = e.target;
      const newValue = name === 'is_active' ? checked : value;

      setFormState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [name]: newValue
        },
        touched: {
          ...prev.touched,
          [name]: true
        }
      }));

      validateField(name, newValue);
    };

    // Validate individual form fields
    const validateField = (fieldName, value) => {
      let error = '';
      
      switch (fieldName) {
        case 'username':
          if (!value) error = 'Username is required';
          break;
        case 'email':
          if (!value) error = 'Email is required';
          else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
          break;
        case 'password':
          if (!value) error = 'Password is required';
          else if (value.length < 8) error = 'Password must be at least 8 characters';
          break;
        case 'first_name':
          if (!value) error = 'First name is required';
          break;
        case 'last_name':
          if (!value) error = 'Last name is required';
          break;
        case 'role_id':
          if (!value) error = 'Role is required';
          break;
        default:
          break;
      }

      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: error
        }
      }));

      return error;
    };

    // Validate all required fields
    const validateForm = () => {
      const requiredFields = ['username', 'email', 'password', 'first_name', 'last_name', 'role_id'];
      let hasErrors = false;
      let errorMessages = [];

      requiredFields.forEach(field => {
        const error = validateField(field, formState.values[field]);
        if (error) {
          hasErrors = true;
          errorMessages.push(error);
        }
      });

      if (hasErrors) {
        // Show the first error message
        message.error(errorMessages[0]);
        // Mark all fields as touched
        setFormState(prev => ({
          ...prev,
          touched: Object.keys(prev.values).reduce((acc, key) => ({
            ...acc,
            [key]: true
          }), {})
        }));
      }

      return !hasErrors;
    };

    // Unified function to handle user creation
    const handleCreateUser = async () => {
      // Validate form first
      if (!validateForm()) {
        return;
      }

      // Set submitting state
      setFormState(prev => ({ ...prev, isSubmitting: true }));

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('Authentication required');
          router.push('/auth/login');
          return;
        }

        // Make API call
        const response = await axios.post(`${API_BASE_URL}/admin/users`, formState.values, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 201) {
          message.success('User created successfully');
          loadUsers();
          loadPendingApprovals();
          handleCloseDialog();
        } else {
          message.error('Failed to create user');
        }
      } catch (err) {
        console.error('Error creating user:', err);
        const errorMessage = err.response?.data?.error || 'Error creating user';
        message.error(errorMessage);
        
        // Handle specific error cases
        if (errorMessage.includes('already exists')) {
          message.warning('A user with this username or email already exists.');
        }
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    };

    // Helper function to get error message for a field
    const getFieldError = (fieldName) => {
      return formState.touched[fieldName] ? formState.errors[fieldName] : '';
    };

    return (
      <>
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTypography-root': {
              fontSize: '1.25rem',
              fontWeight: 600,
            },
          }}
        >
          Add New User
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              name="username"
              fullWidth
              size="small"
              value={formState.values.username}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('username')}
              helperText={getFieldError('username')}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              size="small"
              value={formState.values.email}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              fullWidth
              size="small"
              value={formState.values.password}
              onChange={handleChange}
              variant="outlined"
              autoComplete="new-password"
              error={!!getFieldError('password')}
              helperText={getFieldError('password')}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="First Name"
              name="first_name"
              fullWidth
              size="small"
              value={formState.values.first_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('first_name')}
              helperText={getFieldError('first_name')}
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              size="small"
              value={formState.values.last_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('last_name')}
              helperText={getFieldError('last_name')}
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="role-label" sx={{ fontSize: '0.875rem' }}>Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                name="role_id"
                value={formState.values.role_id}
                onChange={handleChange}
                error={!!getFieldError('role_id')}
                sx={{ 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                }}
              >
                {roles.map((role) => (
                  <MenuItem key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </MenuItem>
                ))}
              </Select>
              {getFieldError('role_id') && (
                <FormHelperText error>{getFieldError('role_id')}</FormHelperText>
              )}
            </FormControl>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formState.values.is_active}
                    onChange={handleChange}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="textPrimary">
                    Active Status
                  </Typography>
                }
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={onCancel}
            variant="outlined"
            disabled={formState.isSubmitting}
            size="small"
            sx={{
              borderRadius: 1.5,
              borderWidth: 1.5,
              fontSize: '0.8rem',
              py: 0.5,
              '&:hover': {
                borderWidth: 1.5,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={formState.isSubmitting}
            size="small"
            sx={{
              borderRadius: 1.5,
              boxShadow: theme.shadows[2],
              fontSize: '0.8rem',
              py: 0.5,
              '&:hover': {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            {formState.isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </>
    );
  };

  // Edit User Form Component
  const EditUserForm = ({ user, onSubmit, onCancel }) => {
    const theme = useTheme();
    const [formState, setFormState] = useState({
      values: {
        username: user?.username || '',
        email: user?.email || '',
        role_id: user?.role_id || '',
        is_active: user?.is_active ?? true,
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        department: user?.department || '',
        position: user?.position || ''
      },
      touched: {},
      errors: {},
      isSubmitting: false
    });

    // Update form state when user prop changes
    useEffect(() => {
      if (user) {
        setFormState(prev => ({
          ...prev,
          values: {
            username: user.username || '',
            email: user.email || '',
            role_id: user.role_id || '',
            is_active: user.is_active ?? true,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            department: user.department || '',
            position: user.position || ''
          }
        }));
      }
    }, [user]);

    // Handle input changes
    const handleChange = (e) => {
      const { name, value, checked } = e.target;
      const newValue = name === 'is_active' ? checked : value;

      setFormState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [name]: newValue
        },
        touched: {
          ...prev.touched,
          [name]: true
        }
      }));

      validateField(name, newValue);
    };

    // Validate individual fields
    const validateField = (fieldName, value) => {
      let error = '';
      
      switch (fieldName) {
        case 'username':
          if (!value) error = 'Username is required';
          else if (value.length < 3) error = 'Username must be at least 3 characters';
          break;
        case 'email':
          if (!value) error = 'Email is required';
          else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
          break;
        case 'role_id':
          if (!value) error = 'Role is required';
          break;
        case 'first_name':
          if (!value) error = 'First name is required';
          break;
        case 'last_name':
          if (!value) error = 'Last name is required';
          break;
        default:
          break;
      }

      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: error
        }
      }));

      return error;
    };

    // Validate all fields
    const validateForm = () => {
      const requiredFields = ['username', 'email', 'role_id', 'first_name', 'last_name'];
      let hasErrors = false;
      let errorMessages = [];

      requiredFields.forEach(field => {
        const error = validateField(field, formState.values[field]);
        if (error) {
          hasErrors = true;
          errorMessages.push(error);
        }
      });

      if (hasErrors) {
        message.error(errorMessages[0]);
        setFormState(prev => ({
          ...prev,
          touched: Object.keys(prev.values).reduce((acc, key) => ({
            ...acc,
            [key]: true
          }), {})
        }));
      }

      return !hasErrors;
    };

    // Handle form submission
    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }

      setFormState(prev => ({ ...prev, isSubmitting: true }));
      
      try {
        await onSubmit(user.user_id, formState.values);
      } catch (error) {
        console.error('Error updating user:', error);
        const errorMessage = error.response?.data?.error || 'Error updating user';
        message.error(errorMessage);
        
        // Handle specific error cases
        if (errorMessage.includes('already exists')) {
          message.warning('A user with this username or email already exists.');
        }
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    };

    // Helper function to get error message
    const getFieldError = (fieldName) => {
      return formState.touched[fieldName] ? formState.errors[fieldName] : '';
    };

    return (
      <>
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTypography-root': {
              fontSize: '1.25rem',
              fontWeight: 600,
            },
          }}
        >
          Edit User Details
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              name="username"
              fullWidth
              size="small"
              value={formState.values.username}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('username')}
              helperText={getFieldError('username')}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              size="small"
              value={formState.values.email}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="First Name"
              name="first_name"
              fullWidth
              size="small"
              value={formState.values.first_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('first_name')}
              helperText={getFieldError('first_name')}
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              size="small"
              value={formState.values.last_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('last_name')}
              helperText={getFieldError('last_name')}
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Department"
              name="department"
              fullWidth
              size="small"
              value={formState.values.department}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Position"
              name="position"
              fullWidth
              size="small"
              value={formState.values.position}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              InputProps={{
                sx: { 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                },
              }}
              InputLabelProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="role-label" sx={{ fontSize: '0.875rem' }}>Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                name="role_id"
                value={formState.values.role_id}
                onChange={handleChange}
                error={!!getFieldError('role_id')}
                sx={{ 
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                }}
              >
                {roles.map((role) => (
                  <MenuItem key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </MenuItem>
                ))}
              </Select>
              {getFieldError('role_id') && (
                <FormHelperText error>{getFieldError('role_id')}</FormHelperText>
              )}
            </FormControl>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formState.values.is_active}
                    onChange={handleChange}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="textPrimary">
                    Active Status
                  </Typography>
                }
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={onCancel}
            variant="outlined"
            disabled={formState.isSubmitting}
            size="small"
            sx={{
              borderRadius: 1.5,
              borderWidth: 1.5,
              fontSize: '0.8rem',
              py: 0.5,
              '&:hover': {
                borderWidth: 1.5,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={formState.isSubmitting}
            size="small"
            sx={{
              borderRadius: 1.5,
              boxShadow: theme.shadows[2],
              fontSize: '0.8rem',
              py: 0.5,
              '&:hover': {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            {formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </>
    );
  };

  const ResetPasswordDialog = ({ user, onClose }) => {
    const theme = useTheme();
    const [formState, setFormState] = useState({
      values: {
        current_password: '',
        new_password: '',
        confirm_password: ''
      },
      touched: {},
      errors: {},
      isSubmitting: false
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [name]: value
        },
        touched: {
          ...prev.touched,
          [name]: true
        }
      }));
    };

    const validateForm = () => {
      const errors = {};
      let hasErrors = false;

      if (!formState.values.current_password) {
        errors.current_password = 'Current password is required';
        hasErrors = true;
      }

      if (!formState.values.new_password) {
        errors.new_password = 'New password is required';
        hasErrors = true;
      } else if (formState.values.new_password.length < 8) {
        errors.new_password = 'Password must be at least 8 characters long';
        hasErrors = true;
      }

      if (!formState.values.confirm_password) {
        errors.confirm_password = 'Please confirm your new password';
        hasErrors = true;
      } else if (formState.values.new_password !== formState.values.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
        hasErrors = true;
      }

      setFormState(prev => ({
        ...prev,
        errors
      }));

      return !hasErrors;
    };

    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }

      setFormState(prev => ({ ...prev, isSubmitting: true }));

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('Authentication required');
          router.push('/auth/login');
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/admin/users/${user.user_id}/reset-password`,
          {
            current_password: formState.values.current_password,
            new_password: formState.values.new_password
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        message.success('Password reset successfully');
        onClose();
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Error resetting password';
        message.error(errorMessage);
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    };

    return (
      <>
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTypography-root': {
              fontSize: '1.5rem',
              fontWeight: 600,
            },
          }}
        >
          Reset Password
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Current Password"
              name="current_password"
              type="password"
              fullWidth
              value={formState.values.current_password}
              onChange={handleChange}
              variant="outlined"
              error={!!formState.errors.current_password}
              helperText={formState.errors.current_password}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
            <TextField
              label="New Password"
              name="new_password"
              type="password"
              fullWidth
              value={formState.values.new_password}
              onChange={handleChange}
              variant="outlined"
              error={!!formState.errors.new_password}
              helperText={formState.errors.new_password}
              InputProps={{
                sx: {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Confirm New Password"
              name="confirm_password"
              type="password"
              fullWidth
              value={formState.values.confirm_password}
              onChange={handleChange}
              variant="outlined"
              error={!!formState.errors.confirm_password}
              helperText={formState.errors.confirm_password}
              InputProps={{
                sx: {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={formState.isSubmitting}
            sx={{
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={formState.isSubmitting}
            sx={{
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              '&:hover': {
                boxShadow: theme.shadows[6],
              },
            }}
          >
            {formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </>
    );
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/admin/audit-logs`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Transform the data to match the frontend requirements
      const transformedLogs = response.data.map(log => ({
        ...log,
        timestamp: log.login_timestamp,
        details: `${log.login_type} attempt from IP: ${log.ip_address}`,
        status: log.login_status.toLowerCase()
      }));

      setAuditLogs(transformedLogs);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error loading audit logs');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Add this function to handle audit logs filtering
  const getFilteredAuditLogs = useCallback(() => {
    return auditLogs.filter(log => {
      // Filter by search term (username)
      const matchesSearch = auditLogsSearchTerm === '' || 
        log.username.toLowerCase().includes(auditLogsSearchTerm.toLowerCase());
      
      // Filter by date
      const matchesDate = auditLogsDateFilter === '' || 
        new Date(log.timestamp).toLocaleDateString() === new Date(auditLogsDateFilter).toLocaleDateString();
      
      // Filter by status
      const matchesStatus = auditLogsStatusFilter === 'all' || 
        log.status === auditLogsStatusFilter;
        
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [auditLogs, auditLogsSearchTerm, auditLogsDateFilter, auditLogsStatusFilter]);

  const renderContent = () => {
    switch (activeTab) {
      case 0: // Users
        return (
          <Box sx={{ width: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                mb: 1.75,
                background: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 1.5,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                width: '100%',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                width="100%"
              >
                <TextField
                  size="small"
                  placeholder="Search users..."
                  sx={{
                    minWidth: { sm: 220 },
                    maxWidth: { sm: 280 },
                    width: { xs: '100%', sm: 'auto' },
                    '& .MuiOutlinedInput-root': {
                      height: 36,
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper,
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 12px',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />,
                  }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ 
                    ml: { sm: 'auto' },
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'space-between', sm: 'flex-start' }
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon sx={{ fontSize: '1rem' }} />}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      borderWidth: 1,
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      height: 36,
                      backgroundColor: alpha(theme.palette.primary.light, 0.05),
                      '&:hover': {
                        borderWidth: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    Filters
                  </Button>
                  <Button
                    component={motion.button}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                    size="small"
                    onClick={() => handleOpenDialog('newUser')}
                    sx={{
                      borderRadius: 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      height: 36,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                      '&:hover': {
                        boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    Add User
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            
            {/* Pending Approvals Section with Animation */}
            <AnimatePresence>
              {pendingApprovals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                >
                  <Box sx={{ mb: 2, width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Chip 
                          label={`${pendingApprovals.length} Pending`} 
                          color="warning" 
                          size="small" 
                          sx={{ mr: 0.5, height: '22px', fontSize: '0.7rem' }} 
                        />
                      </motion.div>
                      Pending Approvals
                    </Typography>
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                        '& .MuiTableRow-root:last-child .MuiTableCell-root': {
                          borderBottom: 0,
                        },
                        width: '100%',
                      }}
                    >
                      <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                            <TableCell sx={{ fontWeight: 600, py: 1, width: '20%' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1, width: '25%' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1, width: '20%' }}>Created By</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1, width: '25%' }}>Created At</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, py: 1, width: '10%' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingApprovals.map((pending) => (
                            <TableRow
                              key={pending.user_id}
                              component={motion.tr}
                              whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}
                            >
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar
                                    sx={{
                                      mr: 1,
                                      width: 28,
                                      height: 28,
                                      bgcolor: theme.palette.primary.main,
                                      fontWeight: 600,
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    {pending.first_name ? pending.first_name[0] : '?'}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="500" noWrap>
                                    {pending.first_name} {pending.last_name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap>{pending.email}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {pending.created_by || 'System'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" fontSize="0.75rem" noWrap>
                                  {new Date(pending.created_at).toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                  <Tooltip title="Approve User">
                                    <IconButton
                                      component={motion.button}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      size="small"
                                      color="primary"
                                      onClick={() => approveUser(pending.user_id, 'approve')}
                                      sx={{
                                        padding: '4px',
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        },
                                      }}
                                    >
                                      <CheckIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject User">
                                    <IconButton
                                      component={motion.button}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      size="small"
                                      color="error"
                                      onClick={() => approveUser(pending.user_id, 'reject')}
                                      sx={{
                                        padding: '4px',
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        },
                                      }}
                                    >
                                      <BlockIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* User Table with Improved Styling */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                width: '100%',
              }}
            >
              <Table size="small" sx={{ minWidth: 650, width: '100%', tableLayout: 'fixed', '& .MuiTableCell-root': { py: 0.75, px: 1.25 } }}>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    '& .MuiTableCell-root': { borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }
                  }}>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem', width: '20%' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem', width: '30%' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem', width: '20%' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem', width: '15%' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem', width: '15%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .filter(user => user.account_status !== 'PENDING' && user.account_status !== 'REJECTED')
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((userRow, index) => (
                      <UserTableRow
                        key={userRow.user_id}
                        user={userRow}
                        onEdit={() => handleOpenDialog('editUser', userRow)}
                        onDelete={() => {
                          if (window.confirm('Are you sure you want to delete this user?')) {
                            deleteUser(userRow.user_id);
                          }
                        }}
                        onResetPassword={() => {
                          setSelectedUserForReset(userRow);
                          setResetPasswordDialog(true);
                        }}
                      />
                    ))}
                  {/* Empty row for when no data is available */}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 1.5 }}>
                        <Box sx={{ textAlign: 'center', py: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8rem' }}>
                            No users found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Try adjusting your search or add a new user
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Enhanced Pagination */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 1.25,
                  py: 0.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  width: '100%',
                }}
              >
                <Typography variant="body2" color="text.secondary" fontSize="0.7rem">
                  Showing {users.length > 0 ? page * rowsPerPage + 1 : 0} - {Math.min((page + 1) * rowsPerPage, users.length)} of {users.length} users
                </Typography>
                <TablePagination
                  component="div"
                  count={users.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage=""
                  backIconButtonProps={{
                    size: "small",
                    sx: { borderRadius: '50%', padding: '3px' }
                  }}
                  nextIconButtonProps={{
                    size: "small",
                    sx: { borderRadius: '50%', padding: '3px' }
                  }}
                  SelectProps={{
                    sx: {
                      minHeight: '24px',
                      '& .MuiSelect-select': {
                        py: 0.25,
                        fontSize: '0.7rem'
                      },
                    },
                  }}
                  sx={{
                    '.MuiTablePagination-toolbar': {
                      minHeight: '32px',
                    },
                    '.MuiTablePagination-displayedRows': {
                      display: 'none',
                    },
                    '.MuiTablePagination-selectLabel': {
                      margin: 0,
                      fontSize: '0.7rem'
                    },
                    '.MuiInputBase-root': {
                      ml: 0.5,
                      mr: 0.5,
                    },
                  }}
                />
              </Box>
            </TableContainer>
          </Box>
        );

      case 1: // Roles
        return (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                mb: 1.75,
                background: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 1.5,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <TextField
                  size="small"
                  placeholder="Search roles..."
                  sx={{
                    minWidth: { sm: 220 },
                    maxWidth: { sm: 280 },
                    '& .MuiOutlinedInput-root': {
                      height: 36,
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper,
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 12px',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />,
                  }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ ml: { sm: 'auto' } }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon sx={{ fontSize: '1rem' }} />}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      borderWidth: 1,
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      height: 36,
                      backgroundColor: alpha(theme.palette.primary.light, 0.05),
                      '&:hover': {
                        borderWidth: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                    size="small"
                    onClick={() => handleOpenDialog('newRole')}
                    sx={{
                      borderRadius: 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      height: 36,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                      '&:hover': {
                        boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    Add Role
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <Table size="small" sx={{ minWidth: 650, '& .MuiTableCell-root': { py: 0.75, px: 1.25 } }}>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    '& .MuiTableCell-root': { borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }
                  }}>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Role Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>System Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Permissions</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.role_id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="500" fontSize="0.8rem">
                          {role.role_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                          {role.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.is_system_role ? 'Yes' : 'No'}
                          color={role.is_system_role ? 'primary' : 'default'}
                          size="small"
                          sx={{
                            height: '20px',
                            fontWeight: 500,
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(role.permissions || {}).map(([module, perms]) => (
                            <Stack key={module} direction="row" spacing={0.5}>
                              {perms.can_create && (
                                <Chip
                                  label="Create"
                                  size="small"
                                  color="success"
                                  sx={{
                                    height: '20px',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                              {perms.can_edit && (
                                <Chip
                                  label="Edit"
                                  size="small"
                                  color="primary"
                                  sx={{
                                    height: '20px',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                              {perms.can_delete && (
                                <Chip
                                  label="Delete"
                                  size="small"
                                  color="error"
                                  sx={{
                                    height: '20px',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                              {perms.can_view && (
                                <Chip
                                  label="View"
                                  size="small"
                                  color="info"
                                  sx={{
                                    height: '20px',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                            </Stack>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          <Tooltip title={role.is_system_role ? "System roles cannot be edited" : "Edit Role"}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog('editRole', role)}
                                disabled={role.is_system_role}
                                sx={{
                                  padding: '3px',
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={role.is_system_role ? "System roles cannot be deleted" : "Delete Role"}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this role?')) {
                                    deleteRole(role.role_id);
                                  }
                                }}
                                disabled={role.is_system_role}
                                sx={{
                                  padding: '3px',
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  px: 1.25,
                  py: 0.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <TablePagination
                  component="div"
                  count={roles.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage=""
                  backIconButtonProps={{
                    size: "small",
                    sx: { borderRadius: '50%', padding: '3px' }
                  }}
                  nextIconButtonProps={{
                    size: "small",
                    sx: { borderRadius: '50%', padding: '3px' }
                  }}
                  SelectProps={{
                    sx: {
                      minHeight: '24px',
                      '& .MuiSelect-select': {
                        py: 0.25,
                        fontSize: '0.7rem'
                      },
                    },
                  }}
                  sx={{
                    '.MuiTablePagination-toolbar': {
                      minHeight: '32px',
                    },
                    '.MuiTablePagination-displayedRows': {
                      display: 'none',
                    },
                    '.MuiTablePagination-selectLabel': {
                      margin: 0,
                      fontSize: '0.7rem'
                    },
                    '.MuiInputBase-root': {
                      ml: 0.5,
                      mr: 0.5,
                    },
                  }}
                />
              </Box>
            </TableContainer>
          </Box>
        );

      case 2: // Audit Logs
        const filteredAuditLogs = getFilteredAuditLogs();
        
        return (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                mb: 1.75,
                background: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 1.5,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <TextField
                  size="small"
                  placeholder="Search by username..."
                  value={auditLogsSearchTerm}
                  onChange={(e) => setAuditLogsSearchTerm(e.target.value)}
                  sx={{
                    minWidth: { sm: 200 },
                    maxWidth: { sm: 280 },
                    '& .MuiOutlinedInput-root': {
                      height: 36,
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper,
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 12px',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />,
                  }}
                />
                <TextField
                  size="small"
                  type="date"
                  value={auditLogsDateFilter}
                  onChange={(e) => setAuditLogsDateFilter(e.target.value)}
                  sx={{
                    width: { xs: '100%', sm: 160 },
                    '& .MuiOutlinedInput-root': {
                      height: 36,
                      borderRadius: 1,
                      fontSize: '0.8rem',
                      backgroundColor: theme.palette.background.paper,
                    },
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, 9px) scale(1)',
                      '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -6px) scale(0.75)',
                      },
                    },
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 120 },
                    '& .MuiOutlinedInput-root': {
                      height: 36,
                      borderRadius: 1,
                      fontSize: '0.8rem',
                      backgroundColor: theme.palette.background.paper,
                    },
                  }}
                >
                  <InputLabel id="audit-status-filter-label" sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
                  <Select
                    labelId="audit-status-filter-label"
                    value={auditLogsStatusFilter}
                    onChange={(e) => setAuditLogsStatusFilter(e.target.value)}
                    label="Status"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} sx={{ ml: { sm: 'auto' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon sx={{ fontSize: '1rem' }} />}
                    size="small"
                    onClick={() => {
                      loadAuditLogs();
                      setAuditLogsSearchTerm('');
                      setAuditLogsDateFilter('');
                      setAuditLogsStatusFilter('all');
                    }}
                    disabled={auditLogsLoading}
                    sx={{
                      borderRadius: 1,
                      borderWidth: 1,
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      height: 36,
                      backgroundColor: alpha(theme.palette.primary.light, 0.05),
                      '&:hover': {
                        borderWidth: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    {auditLogsLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            
            {auditLogsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <Table size="small" sx={{ minWidth: 650, '& .MuiTableCell-root': { py: 0.75, px: 1.25 } }}>
                    <TableHead>
                      <TableRow sx={{ 
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        '& .MuiTableCell-root': { borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }
                      }}>
                        <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Date & Time</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Username</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Login Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>IP Address</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 0.75, fontSize: '0.75rem' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAuditLogs.length > 0 ? (
                        filteredAuditLogs
                          .slice(
                            auditLogsPage * auditLogsPerPage,
                            auditLogsPage * auditLogsPerPage + auditLogsPerPage
                          )
                          .map((log) => (
                            <TableRow
                              key={log.log_id}
                              hover
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                  boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.12)}`,
                                },
                                transition: 'all 0.2s ease',
                                cursor: 'default',
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <HistoryIcon fontSize="small" sx={{ fontSize: '0.9rem', opacity: 0.7 }} />
                                  {new Date(log.timestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar
                                    sx={{
                                      mr: 0.75,
                                      width: 20,
                                      height: 20,
                                      bgcolor: theme.palette.primary.main,
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    {log.username ? log.username[0].toUpperCase() : '?'}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="500" fontSize="0.8rem">
                                    {log.username}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={log.login_type.toUpperCase()}
                                  size="small"
                                  sx={{
                                    height: '20px',
                                    fontWeight: 500,
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontSize="0.75rem" sx={{ fontFamily: 'monospace' }}>
                                  {log.ip_address}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={log.status.toUpperCase()}
                                  size="small"
                                  color={
                                    log.status === 'success'
                                      ? 'success'
                                      : log.status === 'failed'
                                        ? 'error'
                                        : 'warning'
                                  }
                                  sx={{
                                    height: '20px',
                                    fontWeight: 500,
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8rem' }}>
                                No audit logs found
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {auditLogsSearchTerm || auditLogsDateFilter || auditLogsStatusFilter !== 'all' 
                                  ? 'Try adjusting your search criteria' 
                                  : 'User activity logs will appear here'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Enhanced Pagination */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 1.25,
                      py: 0.5,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" fontSize="0.7rem">
                      Showing {filteredAuditLogs.length > 0 ? auditLogsPage * auditLogsPerPage + 1 : 0} - {Math.min((auditLogsPage + 1) * auditLogsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length} logs
                    </Typography>
                    <TablePagination
                      component="div"
                      count={filteredAuditLogs.length}
                      page={auditLogsPage}
                      onPageChange={(event, newPage) => setAuditLogsPage(newPage)}
                      rowsPerPage={auditLogsPerPage}
                      onRowsPerPageChange={(event) => {
                        setAuditLogsPerPage(parseInt(event.target.value, 10));
                        setAuditLogsPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage=""
                      backIconButtonProps={{
                        size: "small",
                        sx: { borderRadius: '50%', padding: '3px' }
                      }}
                      nextIconButtonProps={{
                        size: "small",
                        sx: { borderRadius: '50%', padding: '3px' }
                      }}
                      SelectProps={{
                        sx: {
                          minHeight: '24px',
                          '& .MuiSelect-select': {
                            py: 0.25,
                            fontSize: '0.7rem'
                          },
                        },
                      }}
                      sx={{
                        '.MuiTablePagination-toolbar': {
                          minHeight: '32px',
                        },
                        '.MuiTablePagination-displayedRows': {
                          display: 'none',
                        },
                        '.MuiTablePagination-selectLabel': {
                          margin: 0,
                          fontSize: '0.7rem'
                        },
                        '.MuiInputBase-root': {
                          ml: 0.5,
                          mr: 0.5,
                        },
                      }}
                    />
                  </Box>
                </TableContainer>
              </>
            )}
          </Box>
        );

      case 3: // License Manager
        return <LicenseManager />;
      case 4: // About
        return <AboutTabContent />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search
    }
  }, [debouncedSearchTerm]);

  return (
    <Box
      component={motion.div}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      sx={{ width: '100%' }}
    >
      {/* Dashboard Header */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          width: '100%',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom={false}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users, roles, and system settings
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadUsers();
              loadRoles();
              loadPendingApprovals();
              if (activeTab === 2) loadAuditLogs();
            }}
            sx={{
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
              borderWidth: 1.5,
              '&:hover': {
                borderWidth: 1.5,
              },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Dashboard Stats */}
      <Grid container spacing={2} sx={{ mb: 2, width: '100%', ml: 0 }}>
        <Grid item xs={6} sm={3} sx={{ pl: 0, pr: { xs: 1, sm: 2 } }}>
          <StatCard
            title="Total Users"
            value={users.length}
            icon={<AssignmentIcon fontSize="small" />}
            color={theme.palette.primary.main}
            trend="+12.5%"
          />
        </Grid>
        <Grid item xs={6} sm={3} sx={{ pl: { xs: 1, sm: 2 }, pr: { xs: 0, sm: 2 } }}>
          <StatCard
            title="Active Users"
            value={users.filter(user => user.is_active).length}
            icon={<SecurityIcon fontSize="small" />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={6} sm={3} sx={{ pl: { xs: 0, sm: 2 }, pr: { xs: 1, sm: 2 } }}>
          <StatCard
            title="Roles"
            value={roles.length}
            icon={<HistoryIcon fontSize="small" />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={6} sm={3} sx={{ pl: { xs: 1, sm: 2 }, pr: 0 }}>
          <StatCard
            title="Pending Approvals"
            value={pendingApprovals.length}
            icon={<HistoryIcon fontSize="small" />}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          mb: 1.5,
          width: '100%',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            px: 0.5,
            '& .MuiTabs-indicator': {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
            '& .MuiTab-root': {
              py: 1,
              minHeight: 48,
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            },
          }}
        >
          <Tab
            label="Users"
            icon={<AssignmentIcon />}
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
          <Tab
            label="Roles"
            icon={<SecurityIcon />}
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
          <Tab
            label="Audit Logs"
            icon={<HistoryIcon />}
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
          <Tab
            label="License"
            icon={<VpnKeyIcon />}
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
          <Tab
            label="About"
            icon={<InfoIcon />}
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 1.5, width: '100%' }}>
        {renderContent()}
      </Box>

      {/* Dialogs */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
          }
        }}
      >
        {dialogType === 'newUser' && (
          <CreateUserForm onCancel={handleCloseDialog} />
        )}
        {dialogType === 'editUser' && (
          <EditUserForm
            user={selectedUser}
            onSubmit={updateUser}
            onCancel={handleCloseDialog}
          />
        )}
        {dialogType === 'newRole' && <RoleDialog />}
        {dialogType === 'editRole' && <RoleDialog />}
      </Dialog>

      <Dialog
        open={resetPasswordDialog}
        onClose={() => setResetPasswordDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
          }
        }}
      >
        <ResetPasswordDialog
          user={selectedUserForReset}
          onClose={() => setResetPasswordDialog(false)}
        />
      </Dialog>
    </Box>
  );
};

// User Table Row Component
const UserTableRow = memo(({ user, onEdit, onDelete, onResetPassword }) => {
  const theme = useTheme();
  
  return (
    <TableRow
      hover
      sx={{
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
        transition: 'background-color 0.2s ease',
      }}
    >
      <TableCell>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              mr: 1,
              width: 28,
              height: 28,
              bgcolor: alpha(theme.palette.primary.main, 0.8),
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            {user.first_name ? user.first_name[0] : user.username ? user.username[0].toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="500">
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
              {user.username || 'No username'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography 
          variant="body2" 
          sx={{ 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {user.email}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={user.role_name || 'No role'}
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            height: '20px',
            fontWeight: 500,
            fontSize: '0.65rem',
            borderRadius: '4px',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </TableCell>
      <TableCell>
        <Box
          component="span"
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            bgcolor: user.is_active
              ? alpha(theme.palette.success.main, 0.1)
              : alpha(theme.palette.error.main, 0.1),
            color: user.is_active
              ? theme.palette.success.dark
              : theme.palette.error.dark,
          }}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </Box>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.25} justifyContent="center">
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              color="primary"
              onClick={onEdit}
              sx={{
                padding: '3px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <EditIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              size="small"
              color="error"
              onClick={onDelete}
              sx={{
                padding: '3px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <DeleteIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Password">
            <IconButton
              size="small"
              color="info"
              onClick={onResetPassword}
              sx={{
                padding: '3px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                },
              }}
            >
              <ResetIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

UserTableRow.displayName = 'UserTableRow';

// Final exported component with improved layout and styling
export default function AdminPage() {
  const [activeMainTab, setActiveMainTab] = useState(0);
  const theme = useTheme();
  
  const handleMainTabChange = (event, newValue) => {
    setActiveMainTab(newValue);
  };
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >
      <AdminDashboard />
    </Box>
  );
}
