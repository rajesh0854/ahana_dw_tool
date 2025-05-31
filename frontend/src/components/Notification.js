import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Divider, 
  Paper, 
  useTheme, 
  alpha,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../app/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../app/config';
import ReactMarkdown from 'react-markdown';

const Notification = () => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    // Check if user has notifications to show
    if (user && user.show_notification) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && response.data.length > 0) {
        // Get the latest notification (assuming they're sorted by creation date)
        const latestNotification = response.data[response.data.length - 1];
        setNotification(latestNotification);
        setOpen(true);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    // Mark notification as dismissed
    try {
      await axios.post(`${API_BASE_URL}/admin/notifications/dismiss`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
    setOpen(false);
  };

  // If no user or no notifications to show, don't render anything
  if (!user || !user.show_notification || !notification) {
    return null;
  }

  // Custom styles for markdown content
  const markdownStyles = {
    h1: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginTop: '0.5rem',
      marginBottom: '0',
      paddingBottom: 0,
      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
    },
    h2: {
      fontSize: '1.1rem',
      fontWeight: 600,
      marginTop: '0.4rem',
      marginBottom: '0',
      paddingBottom: 0,
      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 600,
      marginTop: '0.3rem',
      marginBottom: '0',
      paddingBottom: 0,
      color: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.light, 0.9) : theme.palette.primary.dark
    },
    p: {
      marginBottom: '0',
      marginTop: '0',
      paddingTop: 0,
      paddingBottom: 0,
      lineHeight: 1.2,
      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary
    },
    ul: {
      marginLeft: '1.25rem',
      marginTop: '0',
      marginBottom: '0',
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    },
    li: {
      marginBottom: '0',
      marginTop: '0',
      paddingTop: 0,
      paddingBottom: 0,
      lineHeight: 1.1,
      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary
    },
    a: {
      color: theme.palette.primary.main,
      textDecoration: 'underline'
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        // Prevent closing on backdrop click or escape key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        handleClose();
      }}
      maxWidth="xs"
      fullWidth
      PaperComponent={motion.div}
      PaperProps={{
        style: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : theme.palette.background.paper,
        },
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.3 }
      }}
    >
      <DialogTitle 
        sx={{ 
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.6)} 100%)`
            : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 2
        }}
      >
        <NotificationsIcon sx={{ fontSize: 22 }} />
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, flex: 1 }}>
          New Features Available
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="close"
          size="small"
          sx={{ 
            visibility: 'hidden', // Hide the close icon
            color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : 'white',
            '&:hover': { 
              backgroundColor: alpha('#fff', 0.2) 
            }
          }}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          p: 0,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.default, 0.7) 
            : theme.palette.background.default 
        }}
      >
        <Box 
          sx={{ 
            p: 2,
            backgroundImage: theme.palette.mode === 'dark'
              ? `radial-gradient(${alpha(theme.palette.primary.dark, 0.15)} 1px, transparent 1px)`
              : `radial-gradient(${alpha(theme.palette.primary.light, 0.15)} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.dark, 0.2) 
                : alpha(theme.palette.primary.main, 0.2)}`,
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6) 
                : alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.light 
                  : theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
              }}
            >
              {notification.title}
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Box
              sx={{
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.text.primary 
                  : theme.palette.text.secondary,
                whiteSpace: 'pre-line',
                fontSize: '0.875rem',
                '& a': {
                  color: theme.palette.primary.main
                },
                '& ul': {
                  pl: 2,
                  my: 0,
                  py: 0,
                },
                '& li': {
                  py: 0,
                  my: 0,
                },
                '& p': {
                  my: 0,
                  py: 0,
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  mt: 0.5,
                  mb: 0,
                  pb: 0
                },
                '& h1 + ul, & h2 + ul, & h3 + ul, & h4 + ul, & h5 + ul, & h6 + ul': {
                  mt: 0.3,
                },
                '& h1 + p, & h2 + p, & h3 + p, & h4 + p, & h5 + p, & h6 + p': {
                  mt: 0.3,
                }
              }}
            >
              <ReactMarkdown
                components={{
                  h1: ({node, children, ...props}) => <Typography variant="subtitle1" style={markdownStyles.h1} {...props}>{children}</Typography>,
                  h2: ({node, children, ...props}) => <Typography variant="subtitle2" style={markdownStyles.h2} {...props}>{children}</Typography>,
                  h3: ({node, children, ...props}) => <Typography variant="body2" style={markdownStyles.h3} {...props}>{children}</Typography>,
                  p: ({node, children, ...props}) => <Typography variant="body2" style={markdownStyles.p} {...props}>{children}</Typography>,
                  ul: ({node, children, ...props}) => <Box component="ul" sx={markdownStyles.ul} {...props}>{children}</Box>,
                  li: ({node, children, ...props}) => <Box component="li" sx={markdownStyles.li} {...props}>{children}</Box>,
                  a: ({node, children, ...props}) => <Box component="a" sx={markdownStyles.a} target="_blank" rel="noopener" {...props}>{children}</Box>
                }}
              >
                {notification.description}
              </ReactMarkdown>
            </Box>
            <Typography
              variant="caption"
              display="block"
              sx={{
                mt: 1,
                fontSize: '0.7rem',
                textAlign: 'right',
                color: theme.palette.text.disabled
              }}
            >
              {new Date(notification.created_at).toLocaleDateString()}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          px: 2, 
          py: 1.5, 
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.default, 0.8)
        }}
      >
        <Button 
          onClick={handleClose}
          variant="contained"
          fullWidth
          size="small"
          sx={{
            py: 0.75,
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 4px 8px ${alpha(theme.palette.primary.dark, 0.4)}`
              : `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`
              : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark'
                ? `0 6px 12px ${alpha(theme.palette.primary.dark, 0.5)}`
                : `0 6px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            }
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Notification; 