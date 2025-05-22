import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  useTheme,
  alpha,
  FormHelperText,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Checkbox,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { message } from 'antd';

// We'll get modules from props

export const RoleDialog = ({  open,  onClose,  dialogType,  selectedRole,  onSuccess,  modules}) => {
  const theme = useTheme();
  const isNewRole = dialogType === 'newRole';
  const isEditRole = dialogType === 'editRole';

  // Role form state
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    permissions: {}
  });

  // Form validation
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isEditRole && selectedRole) {
      setFormData({
        role_name: selectedRole.role_name || '',
        description: selectedRole.description || '',
        permissions: selectedRole.permissions || {}
      });
    } else if (isNewRole) {
      // Initialize empty permissions for each module
      const initialPermissions = {};
      modules.forEach(module => {
        initialPermissions[module.module_name] = {
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      });

      setFormData({
        role_name: '',
        description: '',
        permissions: initialPermissions
      });
    }
  }, [open, dialogType, selectedRole, isEditRole, isNewRole, modules]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Role name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (module, permission, checked) => {
    setFormData(prev => {
      const updatedPermissions = { 
        ...prev.permissions,
        [module]: {
          ...(prev.permissions[module] || {}),
          [permission]: checked
        }
      };
      
      // If can_view is unchecked, uncheck all other permissions for this module
      if (permission === 'can_view' && !checked) {
        updatedPermissions[module] = {
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      }
      
      // If any other permission is checked, ensure can_view is also checked
      if (permission !== 'can_view' && checked) {
        updatedPermissions[module].can_view = true;
      }
      
      return { ...prev, permissions: updatedPermissions };
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Prevent multiple submissions
    if (loading) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        setLoading(false);
        return;
      }

      if (isNewRole) {
        // Create new role
        const response = await axios.post(
          `${API_BASE_URL}/admin/roles`,
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        message.success('Role created successfully');
      } else if (isEditRole && selectedRole) {
        // Update existing role
        const response = await axios.put(
          `${API_BASE_URL}/admin/roles/${selectedRole.role_id}`,
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        message.success('Role updated successfully');
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => {
    return isNewRole ? "Create New Role" : "Edit Role";
  };

  // Render the form for creating/editing roles
  const renderRoleForm = () => (
    <Box sx={{ p: 1 }}>
      {selectedRole?.is_system_role && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This is a system role. Some fields may not be editable.
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Role Name"
            name="role_name"
            value={formData.role_name}
            onChange={handleChange}
            error={!!errors.role_name}
            helperText={errors.role_name}
            disabled={selectedRole?.is_system_role}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Permissions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 1
            }}
          >
            <Grid container spacing={0}>
              <Grid item xs={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, p: 1 }}>
                  Module
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, p: 1, textAlign: 'center' }}>
                  View
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, p: 1, textAlign: 'center' }}>
                  Create
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, p: 1, textAlign: 'center' }}>
                  Edit
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, p: 1, textAlign: 'center' }}>
                  Delete
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 1 }} />
            
            {modules.map((module, index) => (
              <Box key={module.module_name}>
                <Grid container spacing={0} sx={{ 
                  py: 1, 
                  alignItems: 'center',
                  backgroundColor: index % 2 === 0 ? alpha(theme.palette.background.paper, 0.5) : 'transparent',
                  borderRadius: 1
                }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ pl: 1 }}>
                      {module.display_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={!!formData.permissions[module.module_name]?.can_view}
                      onChange={(e) => handlePermissionChange(module.module_name, 'can_view', e.target.checked)}
                      size="small"
                      disabled={selectedRole?.is_system_role}
                    />
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={!!formData.permissions[module.module_name]?.can_create}
                      onChange={(e) => handlePermissionChange(module.module_name, 'can_create', e.target.checked)}
                      size="small"
                      disabled={!formData.permissions[module.module_name]?.can_view || selectedRole?.is_system_role}
                    />
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={!!formData.permissions[module.module_name]?.can_edit}
                      onChange={(e) => handlePermissionChange(module.module_name, 'can_edit', e.target.checked)}
                      size="small"
                      disabled={!formData.permissions[module.module_name]?.can_view || selectedRole?.is_system_role}
                    />
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={!!formData.permissions[module.module_name]?.can_delete}
                      onChange={(e) => handlePermissionChange(module.module_name, 'can_delete', e.target.checked)}
                      size="small"
                      disabled={!formData.permissions[module.module_name]?.can_view || selectedRole?.is_system_role}
                    />
                  </Grid>
                </Grid>
                {index < modules.length - 1 && <Divider sx={{ my: 0.5 }} />}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const handleEditModule = (module) => {
    onClose(); // Close the current dialog
    handleOpenDialog('editModule', module); // Open the edit dialog with the selected module
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 6,
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {renderTitle()}
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          disabled={loading}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 2 }}>
        {renderRoleForm()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
          sx={{ 
            borderRadius: 1,
            textTransform: 'none',
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || (selectedRole?.is_system_role)}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ 
            borderRadius: 1,
            textTransform: 'none',
            px: 3
          }}
        >
          {isNewRole ? 'Create Role' : 'Update Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleDialog; 