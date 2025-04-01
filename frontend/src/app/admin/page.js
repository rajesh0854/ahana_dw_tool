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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { message } from 'antd';
import LicenseManager from '@/components/LicenseManager';

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
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.95)} 0%, ${alpha(color, 0.85)} 100%)`,
        color: 'white',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 6px 20px -10px ${alpha(color, 0.5)}`,
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, py: 2, px: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body1" fontWeight="medium" sx={{ opacity: 0.9, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: '700', letterSpacing: '-0.5px' }}>
              {value}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            {icon}
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
              fontSize: '1.5rem',
              fontWeight: 600,
            },
          }}
        >
          {dialogType === 'newRole' ? 'Add New Role' : 'Edit Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Role Name"
              name="role_name"
              fullWidth
              value={formState.values.role_name}
              onChange={handleChange}
              variant="outlined"
              disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
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
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={3}
              value={formState.values.description}
              onChange={handleChange}
              variant="outlined"
              disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
              InputProps={{
                sx: { borderRadius: 2 },
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
                    disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
                  />
                }
                label={
                  <Typography variant="body1" color="textPrimary">
                    System Role
                  </Typography>
                }
              />
            </FormGroup>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="600" color="primary" gutterBottom>
                User Management Permissions
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={2}>
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
                            disabled={dialogType === 'editRole' && selectedRole?.is_system_role}
                          />
                        }
                        label={permission.label}
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
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={handleCloseDialog}
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
            disabled={formState.isSubmitting || (dialogType === 'editRole' && selectedRole?.is_system_role)}
            sx={{
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              '&:hover': {
                boxShadow: theme.shadows[6],
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
              fontSize: '1.5rem',
              fontWeight: 600,
            },
          }}
        >
          Add New User
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Username"
              name="username"
              fullWidth
              value={formState.values.username}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('username')}
              helperText={getFieldError('username')}
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
              type="email"
              fullWidth
              value={formState.values.email}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
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
              value={formState.values.password}
              onChange={handleChange}
              variant="outlined"
              autoComplete="new-password"
              error={!!getFieldError('password')}
              helperText={getFieldError('password')}
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
              value={formState.values.first_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('first_name')}
              helperText={getFieldError('first_name')}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              value={formState.values.last_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('last_name')}
              helperText={getFieldError('last_name')}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <FormControl fullWidth variant="outlined">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                name="role_id"
                value={formState.values.role_id}
                onChange={handleChange}
                error={!!getFieldError('role_id')}
                sx={{ borderRadius: 2 }}
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
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={onCancel}
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
            onClick={handleCreateUser}
            disabled={formState.isSubmitting}
            sx={{
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              '&:hover': {
                boxShadow: theme.shadows[6],
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
    console.log( users)
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
          Edit User Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Username"
              name="username"
              fullWidth
              value={formState.values.username}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('username')}
              helperText={getFieldError('username')}
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
              type="email"
              fullWidth
              value={formState.values.email}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('email')}
              helperText={getFieldError('email')}
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
              value={formState.values.first_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('first_name')}
              helperText={getFieldError('first_name')}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              value={formState.values.last_name}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              error={!!getFieldError('last_name')}
              helperText={getFieldError('last_name')}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Department"
              name="department"
              fullWidth
              value={formState.values.department}
              onChange={handleChange}
              variant="outlined"
              autoComplete="off"
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <TextField
              label="Position"
              name="position"
              fullWidth
              value={formState.values.position}
              onChange={handleChange}
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
                name="role_id"
                value={formState.values.role_id}
                onChange={handleChange}
                error={!!getFieldError('role_id')}
                sx={{ borderRadius: 2 }}
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
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            onClick={onCancel}
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

  const renderContent = () => {
    switch (activeTab) {
      case 0: // Users
        return (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                background: alpha(theme.palette.background.paper, 0.5),
                borderRadius: 2,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <TextField
                  size="small"
                  placeholder="Search users..."
                  sx={{
                    minWidth: { sm: 300 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: theme.palette.background.paper,
                    },
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ ml: { sm: 'auto' } }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      borderWidth: 1.5,
                      '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    Filters
                  </Button>
                  <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => handleOpenDialog('newUser')}
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.07)',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                      '&:hover': {
                        boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
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
                >
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Chip 
                          label={`${pendingApprovals.length} Pending`} 
                          color="warning" 
                          size="small" 
                          sx={{ mr: 1 }} 
                        />
                      </motion.div>
                      Pending Approvals
                    </Typography>
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                        '& .MuiTableRow-root:last-child .MuiTableCell-root': {
                          borderBottom: 0,
                        },
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Created By</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Created At</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, py: 1.5 }}>Actions</TableCell>
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
                                      mr: 1.5,
                                      width: 32,
                                      height: 32,
                                      bgcolor: theme.palette.primary.main,
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {pending.first_name ? pending.first_name[0] : '?'}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="500">
                                    {pending.first_name} {pending.last_name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{pending.email}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {pending.created_by || 'System'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                                  {new Date(pending.created_at).toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Approve User">
                                    <IconButton
                                      component={motion.button}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      size="small"
                                      color="primary"
                                      onClick={() => approveUser(pending.user_id, 'approve')}
                                      sx={{
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        },
                                      }}
                                    >
                                      <CheckIcon fontSize="small" />
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
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        },
                                      }}
                                    >
                                      <BlockIcon fontSize="small" />
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
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 5px rgba(0,0,0,0.03)',
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 1.5 }}>Actions</TableCell>
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
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            No users found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
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
                  px: 2,
                  py: 1,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <Typography variant="body2" color="text.secondary">
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
                    size: 'small',
                    sx: { borderRadius: '50%' }
                  }}
                  nextIconButtonProps={{
                    size: 'small',
                    sx: { borderRadius: '50%' }
                  }}
                  SelectProps={{
                    sx: {
                      minHeight: '32px',
                      '& .MuiSelect-select': {
                        py: 0.5,
                      },
                    },
                  }}
                  sx={{
                    '.MuiTablePagination-toolbar': {
                      minHeight: '48px',
                    },
                    '.MuiTablePagination-displayedRows': {
                      display: 'none',
                    },
                    '.MuiTablePagination-selectLabel': {
                      margin: 0,
                    },
                    '.MuiInputBase-root': {
                      ml: 1,
                      mr: 1,
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
                p: 2,
                mb: 3,
                background: theme.palette.background.default,
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <TextField
                  size="medium"
                  placeholder="Search roles..."
                  sx={{
                    minWidth: { sm: 300 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ ml: { sm: 'auto' } }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    sx={{
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('newRole')}
                    sx={{
                      borderRadius: 2,
                      boxShadow: theme.shadows[3],
                      '&:hover': {
                        boxShadow: theme.shadows[6],
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
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Role Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>System Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
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
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {role.role_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {role.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.is_system_role ? 'Yes' : 'No'}
                          color={role.is_system_role ? 'primary' : 'default'}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            borderRadius: '8px',
                            '& .MuiChip-label': { px: 2 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(role.permissions || {}).map(([module, perms]) => (
                            <Stack key={module} direction="row" spacing={0.5}>
                              {perms.can_create && (
                                <Chip
                                  label="Create"
                                  size="small"
                                  color="success"
                                  sx={{
                                    borderRadius: '8px',
                                    '& .MuiChip-label': { px: 1 },
                                  }}
                                />
                              )}
                              {perms.can_edit && (
                                <Chip
                                  label="Edit"
                                  size="small"
                                  color="primary"
                                  sx={{
                                    borderRadius: '8px',
                                    '& .MuiChip-label': { px: 1 },
                                  }}
                                />
                              )}
                              {perms.can_delete && (
                                <Chip
                                  label="Delete"
                                  size="small"
                                  color="error"
                                  sx={{
                                    borderRadius: '8px',
                                    '& .MuiChip-label': { px: 1 },
                                  }}
                                />
                              )}
                              {perms.can_view && (
                                <Chip
                                  label="View"
                                  size="small"
                                  color="info"
                                  sx={{
                                    borderRadius: '8px',
                                    '& .MuiChip-label': { px: 1 },
                                  }}
                                />
                              )}
                            </Stack>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title={role.is_system_role ? "System roles cannot be edited" : "Edit Role"}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog('editRole', role)}
                                disabled={role.is_system_role}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              >
                                <EditIcon />
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
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  },
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={roles.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              />
            </TableContainer>
          </Box>
        );

      case 2: // Audit Logs
        return (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                background: theme.palette.background.default,
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Typography variant="h6" fontWeight="600" color="primary">
                  System Activity Logs
                </Typography>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ ml: { sm: 'auto' } }}
                >
                  <TextField
                    size="small"
                    type="date"
                    InputProps={{
                      sx: { borderRadius: 2 },
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadAuditLogs}
                    disabled={auditLogsLoading}
                    sx={{
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    {auditLogsLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            {auditLogsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {auditLogs.map((log) => (
                  <Grid item xs={12} key={log.log_id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        borderLeft: 6,
                        backgroundColor: alpha(
                          log.status === 'success'
                            ? theme.palette.success.main
                            : log.status === 'failed'
                              ? theme.palette.error.main
                              : theme.palette.warning.main,
                          0.05
                        ),
                        borderColor: log.status === 'success'
                          ? theme.palette.success.main
                          : log.status === 'failed'
                            ? theme.palette.error.main
                            : theme.palette.warning.main,
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <HistoryIcon fontSize="small" />
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Typography variant="subtitle1" fontWeight="500">
                            {log.username}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" color="text.primary">
                            {log.login_type.toUpperCase()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
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
                              borderRadius: '8px',
                              '& .MuiChip-label': { px: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic' }}
                          >
                            {log.details}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

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
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      <Box
        component={motion.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          backgroundColor: theme.palette.background.default,
          maxWidth: '1600px',
          mx: 'auto',
        }}
      >
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              title: "Total Users",
              value: users.length.toString(),
              trend: "+12% this month",
              icon: <AssignmentIcon fontSize="medium" />,
              color: theme.palette.primary.main,
              delay: 0.1
            },
            {
              title: "Active Roles",
              value: roles.length.toString(),
              trend: "+2 new roles",
              icon: <SecurityIcon fontSize="medium" />,
              color: theme.palette.success.main,
              delay: 0.2
            },
            {
              title: "Recent Activities",
              value: "24",
              trend: "Last 24 hours",
              icon: <HistoryIcon fontSize="medium" />,
              color: theme.palette.warning.main,
              delay: 0.3
            },
          ].map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: card.delay, duration: 0.3 }}
              >
                <StatCard {...card} />
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Main Content */}
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          elevation={0}
          sx={{
            width: '100%',
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: theme.palette.background.paper,
              px: 2,
              '& .MuiTab-root': {
                minHeight: 56,
                fontSize: '0.95rem',
                fontWeight: 500,
                textTransform: 'none',
                '&.Mui-selected': {
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              },
            }}
          >
            <Tab 
              label="Users" 
              icon={<AssignmentIcon fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              label="Roles" 
              icon={<SecurityIcon fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              label="Audit Logs" 
              icon={<HistoryIcon fontSize="small" />} 
              iconPosition="start"
            />
          </Tabs>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{renderContent()}</Box>
        </Paper>

        {/* Dialogs */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          TransitionComponent={Zoom} // Add a Zoom transition effect
          PaperProps={{
            component: motion.div,
            layoutId: "dialogContent", // For smoother animation
            sx: {
              borderRadius: 2.5,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            },
          }}
        >
          {dialogType === 'newUser' && <CreateUserForm onCancel={handleCloseDialog} />}
          {dialogType === 'editUser' && <EditUserForm user={selectedUser} onSubmit={updateUser} onCancel={handleCloseDialog} />}
          {(dialogType === 'newRole' || dialogType === 'editRole') && <RoleDialog />}
        </Dialog>

        <Dialog
          open={resetPasswordDialog}
          onClose={() => {
            setResetPasswordDialog(false);
            setSelectedUserForReset(null);
          }}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Zoom} // Add a Zoom transition effect
          PaperProps={{
            component: motion.div,
            layoutId: "resetPasswordDialog", // For smoother animation
            sx: {
              borderRadius: 2.5,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            },
          }}
        >
          {selectedUserForReset && (
            <ResetPasswordDialog
              user={selectedUserForReset}
              onClose={() => {
                setResetPasswordDialog(false);
                setSelectedUserForReset(null);
              }}
            />
          )}
        </Dialog>
      </Box>
    </motion.div>
  );
};

// Memoized UserTableRow component with proper theme access
const UserTableRow = memo(({ user, onEdit, onDelete, onResetPassword }) => {
  const theme = useTheme(); // Get theme inside the component

  return (
    <TableRow
      component={motion.tr}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}
      sx={{
        '&:last-child td, &:last-child th': { border: 0 },
      }}
    >
      <TableCell>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              mr: 1.5,
              width: 32,
              height: 32,
              bgcolor: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {user.username ? user.username[0].toUpperCase() : '?'}
          </Avatar>
          <Typography variant="body2" fontWeight="500">
            {user.username}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{user.email}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={user.role_name || 'N/A'}
          color={user.role_name === 'SUPER_ADMIN' || user.role_name === 'ADMIN' ? 'primary' : 'default'}
          size="small"
          sx={{
            height: '24px',
            fontWeight: 500,
            borderRadius: '6px',
            fontSize: '0.75rem',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={user.is_active ? 'ACTIVE' : 'INACTIVE'}
          color={user.is_active ? 'success' : 'default'}
          size="small"
          icon={user.is_active ? <CheckIcon style={{fontSize: '14px'}} /> : <BlockIcon style={{fontSize: '14px'}} />}
          sx={{
            height: '24px',
            fontWeight: 500,
            borderRadius: '6px',
            fontSize: '0.75rem',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          <Tooltip title="Edit User">
            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              size="small"
              color="primary"
              onClick={onEdit}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Password">
            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              size="small"
              color="warning"
              onClick={onResetPassword}
            >
              <ResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              size="small"
              color="error"
              onClick={onDelete}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

UserTableRow.displayName = 'UserTableRow';

// Define the content for the About tab
const AboutTabContent = () => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Placeholder for Logo */}
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>L</Avatar>
                <Typography variant="h5" component="h2" fontWeight="bold">
                    Ahana DW Tool
                </Typography>
            </Box>
            <Divider />
            <Box>
                <Typography variant="h6" gutterBottom>Company Details</Typography>
                <Typography variant="body1">Innovate Solutions Inc.</Typography>
                <Typography variant="body2" color="text.secondary">Leading the way in data warehousing innovations.</Typography>
            </Box>
            <Box>
                <Typography variant="h6" gutterBottom>Development Team</Typography>
                <Typography variant="body1">Innovate Core Development Team</Typography>
                {/* Add more developer details if needed */}
            </Box>
            <Box>
                <Typography variant="h6" gutterBottom>Version</Typography>
                <Typography variant="body1">1.0.0</Typography> { /* Placeholder version */}
            </Box>
            <Divider />
            <Box>
                <Typography variant="body2" color="text.secondary">
                    &copy; {new Date().getFullYear()} Innovate Solutions Inc. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default function AdminPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mainTabValue, setMainTabValue] = useState(0); // 0 for Manage Users, 1 for License, 2 for About

    const handleMainTabChange = (event, newValue) => {
        setMainTabValue(newValue);
    };

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, backgroundColor: theme.palette.background.default, maxWidth: '1600px', mx: 'auto' }}>
            {/* Tabs are now outside the Paper */}
            <Tabs
                value={mainTabValue}
                onChange={handleMainTabChange}
                variant={isMobile ? 'fullWidth' : 'standard'}
                sx={{
                    mb: 2, // Add some margin below the tabs
                    borderBottom: 1,
                    borderColor: 'divider',
                    // Removed background color - tabs will sit directly on the page background
                    '& .MuiTab-root': {
                        minHeight: 56,
                        fontSize: '1rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&.Mui-selected': {
                            fontWeight: 600,
                        },
                    },
                    '& .MuiTabs-indicator': {
                        height: 3,
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                    },
                }}
            >
                <Tab 
                    label="Manage Users & Roles" 
                    icon={<SecurityIcon fontSize="small" />} 
                    iconPosition="start"
                />
                <Tab 
                    label="License Management" 
                    icon={<AssignmentIcon fontSize="small" />} 
                    iconPosition="start" 
                />
                <Tab 
                    label="About" 
                    icon={<InfoIcon fontSize="small" />} // Add About tab
                    iconPosition="start" 
                />
            </Tabs>

            {/* Paper now only wraps the content */}
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    // Removed mb: 2 from Paper
                    // Removed px from Tabs sx above as it's no longer inside Paper
                }}
            >
                 <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {mainTabValue === 0 && <AdminDashboard />}
                    {mainTabValue === 1 && <LicenseManager />}
                    {mainTabValue === 2 && <AboutTabContent />} { /* Render About content */}
                 </Box>
            </Paper>
        </Box>
    );
}