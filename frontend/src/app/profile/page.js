'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Stack,
  Alert,
  Snackbar,
  useMediaQuery,
  Link,
  Fade,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  WorkOutline as WorkIcon,
  CalendarToday as CalendarIcon,
  AccountCircle as AccountIcon,
  Person as PersonIcon,
  SaveOutlined as SaveIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout, updateUserProfile } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [editedData, setEditedData] = useState({
    first_name: '', last_name: '', email: '', phone: '', department: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  // Animation states
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const typingIndex = useRef(0);
  const animationStarted = useRef(false);

  const developerName = "Ahana Dev Team";
  const appVersion = "v2.0.0";

  // Typing animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animationStarted.current) {
          animationStarted.current = true;
          setIsTypingComplete(false);
          typingIndex.current = 0;
          setDisplayText('');
        }
      },
      { threshold: 0.5 }
    );

    const signatureElement = document.getElementById('developer-signature');
    if (signatureElement) {
      observer.observe(signatureElement);
    }

    return () => {
      if (signatureElement) {
        observer.unobserve(signatureElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!animationStarted.current || isTypingComplete) return;
    
    if (typingIndex.current < developerName.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + developerName[typingIndex.current]);
        typingIndex.current += 1;
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsTypingComplete(true);
    }
  }, [displayText, isTypingComplete]);

  useEffect(() => {
    if (!user) return;
    setProfileData({ ...user, is_active: true });
    setEditedData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || ''
    });
    setLoading(false);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleEditDialogOpen = () => setOpenEditDialog(true);
  const handleEditDialogClose = () => setOpenEditDialog(false);
  const handlePasswordDialogOpen = () => setOpenPasswordDialog(true);
  const handlePasswordDialogClose = () => {
    setOpenPasswordDialog(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleEditChange = (e) => setEditedData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePasswordChange = (e) => setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveProfile = async () => {
    try {
      updateUserProfile(editedData);
      setProfileData(prev => ({ ...prev, ...editedData }));
      setNotification({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      handleEditDialogClose();
    } catch (error) {
      setNotification({ open: true, message: 'Failed to update profile.', severity: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ open: true, message: 'New passwords do not match.', severity: 'error' });
      return;
    }
    try {
      setNotification({ open: true, message: 'Password changed successfully!', severity: 'success' });
      handlePasswordDialogClose();
    } catch (error) {
      setNotification({ open: true, message: 'Failed to change password.', severity: 'error' });
    }
  };

  const handleCloseNotification = () => setNotification(prev => ({ ...prev, open: false }));

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        bgcolor: 'background.default' 
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
            <PersonIcon sx={{ fontSize: 30 }} />
          </Avatar>
        </motion.div>
      </Box>
    );
  }

  return (
    <ProtectedRoute>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'background.paper', 
            borderBottom: 1, 
            borderColor: 'divider', 
            py: { xs: 1.5, md: 2 } 
          }}
        >
          <Container maxWidth="lg">
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={{ xs: 2, sm: 0 }}
            >
              <Typography variant="h5" fontWeight={600} color="text.primary">
                My Profile
              </Typography>
              <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<SecurityIcon />}
                  onClick={handlePasswordDialogOpen}
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none', 
                    flex: { xs: 1, sm: 'none' },
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }
                  }}
                >
                  Security
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  color="error"
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none',
                    flex: { xs: 1, sm: 'none' }
                  }}
                >
                  Logout
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Paper>

        <Container maxWidth="xl" sx={{ py: 1, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Top Row - Profile and Details */}
            <Box sx={{ flex: '0 0 36%', mb: 2 }}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                {/* Profile Card */}
                <Grid item xs={12} lg={3} md={3} sx={{ height: '100%' }}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ height: '100%' }}>
                    <Paper sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      border: 1, 
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'none'
                    }}>
                      <Box sx={{ textAlign: 'center', mb: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Avatar sx={{ 
                          width: 48, 
                          height: 48, 
                          mx: 'auto', 
                          mb: 1,
                          bgcolor: 'primary.main',
                          fontSize: '1.2rem',
                          fontWeight: 600
                        }}>
                          {profileData?.first_name?.charAt(0) || profileData?.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                          {`${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || profileData?.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                          {profileData?.role || 'User'}
                        </Typography>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          px: 1, 
                          py: 0.25, 
                          bgcolor: profileData?.is_active ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                          color: profileData?.is_active ? 'success.main' : 'error.main',
                          borderRadius: 1,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          gap: 0.25,
                          mx: 'auto'
                        }}>
                          <CheckCircleIcon sx={{ fontSize: '0.65rem' }} />
                          {profileData?.is_active ? 'Active' : 'Inactive'}
                        </Box>
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        fullWidth 
                        startIcon={<EditIcon sx={{ fontSize: '1rem' }} />}
                        onClick={handleEditDialogOpen}
                        sx={{ 
                          borderRadius: 1.5, 
                          textTransform: 'none',
                          py: 0.75,
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        Edit Profile
                      </Button>
                    </Paper>
                  </motion.div>
                </Grid>

                {/* Details Section */}
                <Grid item xs={12} lg={9} md={9} sx={{ height: '100%' }}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ height: '100%' }}>
                    <Paper sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'none'
                    }}>
                      <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
                        Account Information
                      </Typography>
                      
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Grid container spacing={1.5} sx={{ height: '100%' }}>
                          {[
                            { label: 'Username', value: profileData?.username, icon: <AccountIcon color="primary" sx={{ fontSize: '1.1rem' }} /> },
                            { label: 'Email', value: profileData?.email, icon: <EmailIcon color="primary" sx={{ fontSize: '1.1rem' }} /> },
                            { label: 'Phone', value: profileData?.phone || 'Not provided', icon: <PhoneIcon color="primary" sx={{ fontSize: '1.1rem' }} /> },
                            { label: 'Department', value: profileData?.department || 'Not specified', icon: <WorkIcon color="primary" sx={{ fontSize: '1.1rem' }} /> },
                            { label: 'First Name', value: profileData?.first_name || 'Not provided', icon: <PersonIcon color="primary" sx={{ fontSize: '1.1rem' }} /> },
                            { label: 'Last Name', value: profileData?.last_name || 'Not provided', icon: <PersonIcon color="primary" sx={{ fontSize: '1.1rem' }} /> }
                          ].map((item, index) => (
                            <Grid item xs={12} sm={6} lg={4} key={index} sx={{ height: '33.33%' }}>
                              <Box sx={{ 
                                p: 1, 
                                bgcolor: alpha(theme.palette.primary.main, 0.03), 
                                borderRadius: 1.5,
                                border: 1,
                                borderColor: alpha(theme.palette.primary.main, 0.08),
                                transition: 'all 0.2s ease',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  bgcolor: alpha(theme.palette.primary.main, 0.06)
                                }
                              }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                  {item.icon}
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.65rem' }}>
                                      {item.label}
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      fontWeight={600} 
                                      color="text.primary"
                                      sx={{ 
                                        wordBreak: 'break-word',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontSize: '0.75rem',
                                        lineHeight: 1.1
                                      }}
                                    >
                                      {item.value}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>

            {/* Bottom Row - Company and App Info */}
            <Box sx={{ flex: '0 0 52%', mb: 1 }}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                {/* Company Info */}
                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ height: '100%' }}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: 1, 
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'none'
                    }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main', 
                          width: 36, 
                          height: 36 
                        }}>
                          <BusinessIcon sx={{ fontSize: '1.1rem' }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: '1.1rem' }}>
                          About Company
                        </Typography>
                      </Stack>
                      
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ fontSize: '1rem', mb: 1 }}>
                          Ahana Systems & Solutions Pvt Ltd
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', fontSize: '0.85rem' }}>
                          "Creating Possibilities"
                        </Typography>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <LanguageIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                            <Link 
                              href="https://www.ahanait.com" 
                              target="_blank" 
                              sx={{ 
                                color: 'primary.main', 
                                textDecoration: 'none', 
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              www.ahanait.com
                            </Link>
                          </Stack>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <EmailIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                            <Link 
                              href="mailto:info@ahanait.co.in" 
                              sx={{ 
                                color: 'primary.main', 
                                textDecoration: 'none', 
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              info@ahanait.co.in
                            </Link>
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ mt: 'auto' }}>
                          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              Connect with us:
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1.5, 
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            mb: 1.5
                          }}>
                            {[
                              { icon: <LanguageIcon />, href: "https://www.ahanait.com", color: 'text.secondary' },
                              { icon: <EmailIcon />, href: "mailto:info@ahanait.co.in", color: 'error.main' },
                              { icon: <LinkedInIcon />, href: "https://www.linkedin.com/company/ahana-systems-solutions/", color: '#0077b5' },
                              { icon: <TwitterIcon />, href: "https://twitter.com/ahana_it", color: '#1da1f2' },
                              { icon: <GitHubIcon />, href: "https://github.com/ahana-systems", color: 'text.primary' }
                            ].map((social, index) => (
                              <Box
                                key={index}
                                component={Link}
                                href={social.href}
                                target="_blank"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  color: social.color,
                                  textDecoration: 'none',
                                  border: 1,
                                  borderColor: alpha(theme.palette.primary.main, 0.1),
                                  transition: 'all 0.2s ease',
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[3]
                                  },
                                  '& svg': {
                                    fontSize: '1.1rem'
                                  }
                                }}
                              >
                                {social.icon}
                              </Box>
                            ))}
                          </Box>
                          
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>

                {/* App Info */}
                <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ height: '100%' }}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: 1, 
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'none'
                    }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                          color: 'secondary.main', 
                          width: 36, 
                          height: 36 
                        }}>
                          <CodeIcon sx={{ fontSize: '1.1rem' }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: '1.1rem' }}>
                          Application
                        </Typography>
                      </Stack>
                      
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 1.5, 
                              bgcolor: alpha(theme.palette.primary.main, 0.05), 
                              borderRadius: 1.5,
                              border: 1,
                              borderColor: alpha(theme.palette.primary.main, 0.15)
                            }}>
                              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ fontSize: '1.1rem' }}>
                                {appVersion}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Version
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 1.5, 
                              bgcolor: alpha(theme.palette.success.main, 0.05), 
                              borderRadius: 1.5,
                              border: 1,
                              borderColor: alpha(theme.palette.success.main, 0.15)
                            }}>
                              <Typography variant="h5" fontWeight={700} color="success.main" sx={{ fontSize: '1.1rem' }}>
                                Active
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Status
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic', mb: 1 }}>
                            Developed with ❤️
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            © {new Date().getFullYear()} Ahana Systems & Solutions
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                            Data Warehouse Management System
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>


          </Box>
        </Container>
      </Box>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleEditDialogClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Edit Profile
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="first_name"
                value={editedData.first_name}
                onChange={handleEditChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="last_name"
                value={editedData.last_name}
                onChange={handleEditChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                value={editedData.email}
                onChange={handleEditChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                name="phone"
                value={editedData.phone}
                onChange={handleEditChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                name="department"
                value={editedData.department}
                onChange={handleEditChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleEditDialogClose} 
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{ textTransform: 'none' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={handlePasswordDialogClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Change Password
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handlePasswordDialogClose} 
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained" 
            startIcon={<SecurityIcon />}
            sx={{ textTransform: 'none' }}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ProtectedRoute>
  );
};

export default ProfilePage; 