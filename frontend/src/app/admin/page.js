'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useRouter } from 'next/navigation';

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

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    active: true,
  });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const { user, loading, handleTokenExpiration } = useAuth();
  const router = useRouter();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if(newValue === 0) {
      loadUsers();
      loadPendingApprovals();
    }
  };

  const handleOpenDialog = (type, data = null) => {
    if (type === 'editUser') {
      setSelectedUser(data);
    } else if (type === 'editRole') {
      setSelectedRole(data);
    } else if (type === 'newUser') {
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'user',
        active: true,
      });
    }
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setSelectedRole(null);
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
        setNotification({ message: 'Session expired. Please login again.', type: 'error' });
        router.push('/auth/login');
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading) {
      loadUsers();
      loadPendingApprovals();
    }
  }, [loading, user]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/users`, { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (await handleApiError(response)) return;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setNotification({ message: err.message || 'Error loading users', type: 'error' });
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/pending-approvals`, { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (await handleApiError(response)) return;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load pending approvals');
      }

      const data = await response.json();
      setPendingApprovals(data);
    } catch (err) {
      setNotification({ message: err.message || 'Error loading pending approvals', type: 'error' });
    }
  };

  const createUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Authentication required', type: 'error' });
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser),
      });

      if (await handleApiError(response)) return;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const result = await response.json();
      setNotification({ message: 'User created successfully', type: 'success' });
      loadUsers();
      loadPendingApprovals();
      handleCloseDialog();
    } catch (err) {
      setNotification({ message: err.message || 'Error creating user', type: 'error' });
    }
  };

  const approveUser = async (userId, actionType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Authentication required', type: 'error' });
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/approve-user/${userId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: actionType }),
      });

      if (await handleApiError(response)) return;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update approval');
      }

      const result = await response.json();
      setNotification({ message: result.message, type: 'success' });
      loadUsers();
      loadPendingApprovals();
    } catch (err) {
      setNotification({ message: err.message || 'Error updating approval', type: 'error' });
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.95)} 0%, ${alpha(color, 0.85)} 100%)`,
        color: 'white',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30%',
          height: '100%',
          background: `linear-gradient(to right, transparent, ${alpha(color, 0.3)})`,
          transform: 'skewX(-15deg)',
        },
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ opacity: 0.9, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: '800', letterSpacing: '-0.5px' }}>
              {value}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 20, mr: 0.5 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              p: 2,
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

  const UserDialog = () => {
    if (dialogType === 'newUser') {
      return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Username"
            fullWidth
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            variant="outlined"
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
            fullWidth
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="First Name"
            fullWidth
            value={newUser.first_name}
            onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <TextField
            label="Last Name"
            fullWidth
            value={newUser.last_name}
            onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
                  checked={newUser.active}
                  onChange={(e) => setNewUser({ ...newUser, active: e.target.checked })}
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
          label="Full Name"
          fullWidth
          defaultValue={selectedUser?.name}
          variant="outlined"
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
          fullWidth
          defaultValue={selectedUser?.email}
          variant="outlined"
          InputProps={{
            sx: {
              borderRadius: 2,
            },
          }}
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            defaultValue={selectedUser?.role || 'user'}
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
                defaultChecked={selectedUser?.status === 'Active'}
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

  const RoleDialog = () => (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        label="Role Name"
        fullWidth
        defaultValue={selectedRole?.name}
        variant="outlined"
        InputProps={{
          sx: { borderRadius: 2 },
        }}
      />
      <TextField
        label="Description"
        fullWidth
        multiline
        rows={3}
        defaultValue={selectedRole?.description}
        variant="outlined"
        InputProps={{
          sx: { borderRadius: 2 },
        }}
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle1" fontWeight="600" color="primary" gutterBottom>
          Permissions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Read"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Write"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Delete"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Approve"
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 0: // Users
        return (
          <Box>
            {notification.message && (
              <Alert severity={notification.type} onClose={() => setNotification({ message: '', type: '' })} sx={{ mb: 2 }}>
                {notification.message}
              </Alert>
            )}
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
                  placeholder="Search users..."
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
                    onClick={() => handleOpenDialog('newUser')}
                    sx={{
                      borderRadius: 2,
                      boxShadow: theme.shadows[3],
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                      },
                    }}
                  >
                    Add User
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            {pendingApprovals.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Pending Approvals
                </Typography>
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
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingApprovals.map((pending) => (
                        <TableRow
                          key={pending.user_id}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar
                                sx={{
                                  mr: 2,
                                  bgcolor: theme.palette.primary.main,
                                  fontWeight: 600,
                                }}
                              >
                                {pending.first_name ? pending.first_name[0] : '?'}
                              </Avatar>
                              <Typography variant="body1" fontWeight="500">
                                {pending.first_name} {pending.last_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{pending.email}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {pending.created_at ? new Date(pending.created_at).toLocaleString() : ''}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Approve User">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => approveUser(pending.user_id, 'approve')}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                  }}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject User">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => approveUser(pending.user_id, 'reject')}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                >
                                  <BlockIcon />
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
            )}
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
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((userRow) => (
                    <TableRow
                      key={userRow.user_id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            sx={{
                              mr: 2,
                              bgcolor: theme.palette.primary.main,
                              fontWeight: 600,
                            }}
                          >
                            {userRow.first_name ? userRow.first_name[0] : '?'}
                          </Avatar>
                          <Typography variant="body1" fontWeight="500">
                            {userRow.first_name} {userRow.last_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{userRow.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={userRow.roles && userRow.roles.length > 0 ? userRow.roles.join(', ') : 'N/A'}
                          color={userRow.roles && userRow.roles.includes('SUPER_ADMIN') || userRow.roles.includes('ADMIN') ? 'primary' : 'default'}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            borderRadius: '8px',
                            '& .MuiChip-label': { px: 2 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={userRow.account_status}
                          color={userRow.account_status === 'ACTIVE' ? 'success' : userRow.account_status === 'PENDING' ? 'warning' : 'default'}
                          size="small"
                          icon={userRow.account_status === 'ACTIVE' ? <CheckIcon /> : <BlockIcon />}
                          sx={{
                            fontWeight: 500,
                            borderRadius: '8px',
                            '& .MuiChip-label': { px: 2 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {userRow.lastLogin ? new Date(userRow.lastLogin).toLocaleString() : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog('editUser', userRow)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              color="warning"
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                },
                              }}
                            >
                              <ResetIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              color="error"
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={users.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              />
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
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h6" fontWeight="600" color="primary">
                  Role Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('newRole')}
                  sx={{
                    ml: 'auto',
                    borderRadius: 2,
                    boxShadow: theme.shadows[3],
                    '&:hover': {
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  Create Role
                </Button>
              </Stack>
            </Paper>
            <Grid container spacing={3}>
              {mockRoles.map((role) => (
                <Grid item xs={12} md={4} key={role.id}>
                  <Card
                    component={motion.div}
                    whileHover={{ scale: 1.02 }}
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '&:hover': {
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" color="primary" fontWeight="600">
                          {role.name}
                        </Typography>
                        <Tooltip title="Edit Role">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('editRole', role)}
                            sx={{
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                        sx={{ minHeight: 40 }}
                      >
                        {role.description}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <AssignmentIcon fontSize="small" />
                          Users: {role.userCount}
                        </Typography>
                        <Box display="flex" gap={0.5}>
                          {role.permissions.map((permission) => (
                            <Chip
                              key={permission}
                              label={permission}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                borderRadius: '8px',
                                '& .MuiChip-label': { px: 1.5 },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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
                    sx={{
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            <Grid container spacing={2}>
              {mockAuditLogs.map((log) => (
                <Grid item xs={12} key={log.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      borderLeft: 6,
                      backgroundColor: alpha(
                        log.type === 'create'
                          ? theme.palette.success.main
                          : log.type === 'delete'
                            ? theme.palette.error.main
                            : theme.palette.info.main,
                        0.05
                      ),
                      borderColor: log.type === 'create'
                        ? theme.palette.success.main
                        : log.type === 'delete'
                          ? theme.palette.error.main
                          : theme.palette.info.main,
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
                          {log.timestamp}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="subtitle1" fontWeight="500">
                          {log.user}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.primary">
                          {log.action}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
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
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 600,
          color: theme.palette.text.primary,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        Admin Dashboard
      </Typography> */}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={users.length.toString()}
            trend="+12% this month"
            icon={<AssignmentIcon fontSize="large" />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Roles"
            value="8"
            trend="+2 new roles"
            icon={<SecurityIcon fontSize="large" />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Recent Activities"
            value="24"
            trend="Last 24 hours"
            icon={<HistoryIcon fontSize="large" />}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          mb: 2,
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
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
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              '&.Mui-selected': {
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab label="Users" />
          <Tab label="Roles" />
          <Tab label="Audit Logs" />
        </Tabs>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{renderContent()}</Box>
      </Paper>

      {/* Dialogs */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
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
          {dialogType === 'newUser'
            ? 'Add New User'
            : dialogType === 'editUser'
              ? 'Edit User Details'
              : dialogType === 'newRole'
                ? 'Create New Role'
                : 'Edit Role'}
        </DialogTitle>
        <DialogContent>
          {(dialogType === 'newUser' || dialogType === 'editUser') && <UserDialog />}
          {(dialogType === 'newRole' || dialogType === 'editRole') && <RoleDialog />}
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
            onClick={() => {
              if (dialogType === 'newUser') {
                createUser();
              } else {
                handleCloseDialog();
              }
            }}
            sx={{
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              '&:hover': {
                boxShadow: theme.shadows[6],
              },
            }}
          >
            {dialogType.startsWith('new') ? 'Create' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;