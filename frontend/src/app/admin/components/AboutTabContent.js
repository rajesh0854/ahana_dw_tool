import React from 'react';
import { Box, Typography, Divider, Avatar, useTheme, Link, Stack, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

const AboutTabContent = () => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
            {/* Header with Logo */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2
            }}>
                <Avatar sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    width: 56, 
                    height: 56
                }}>A</Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        Ahana DW Tool
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Data Warehouse Management System
                    </Typography>
                </Box>
            </Box>
            
            <Divider />
            
            {/* Company Info */}
            <Box>
                <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="medium">
                    Company Details
                </Typography>
                <Typography variant="body1">Ahana Systems & Solutions Pvt Ltd</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    "Creating Possibilities"
                </Typography>
            </Box>
            
            {/* Version Info */}
            <Box>
                <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="medium">
                    Version
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">1.0.0</Typography>
                    <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: alpha(theme.palette.success.light, 0.1),
                        color: theme.palette.success.main,
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        ml: 1
                    }}>
                        <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">Up to date</Typography>
                    </Box>
                </Box>
            </Box>
            
            {/* Contact & Social Links */}
            <Box>
                <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="medium">
                    Connect With Us
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 0.5 }}>
                    <IconButton 
                        component={Link}
                        href="https://www.ahanait.com"
                        target="_blank"
                        rel="noopener"
                        size="small"
                        sx={{ color: theme.palette.text.secondary }}
                    >
                        <LanguageIcon />
                    </IconButton>
                    
                    <IconButton 
                        component={Link}
                        href="mailto:info@ahanait.com"
                        size="small"
                        sx={{ color: theme.palette.text.secondary }}
                    >
                        <EmailIcon />
                    </IconButton>
                    
                    <IconButton 
                        component={Link}
                        href="https://www.linkedin.com" 
                        target="_blank"
                        rel="noopener"
                        size="small"
                        sx={{ color: '#0077B5' }}
                    >
                        <LinkedInIcon />
                    </IconButton>
                    
                    <IconButton 
                        component={Link}
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener"
                        size="small"
                        sx={{ color: '#1DA1F2' }}
                    >
                        <TwitterIcon />
                    </IconButton>
                    
                    <IconButton 
                        component={Link}
                        href="https://github.com"
                        target="_blank"
                        rel="noopener"
                        size="small"
                        sx={{ color: theme.palette.text.secondary }}
                    >
                        <GitHubIcon />
                    </IconButton>
                </Stack>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Website: <Link href="https://www.ahanait.com" target="_blank" rel="noopener" underline="hover">ahanait.com</Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Email: <Link href="mailto:info@ahana.co.in" underline="hover">info@ahanait.co.in</Link>
                </Typography>
            </Box>
            
            <Divider sx={{ mt: 1 }} />
            
            {/* Footer */}
            <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                    &copy; {new Date().getFullYear()} Ahana Systems & Solutions Pvt Ltd. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default AboutTabContent; 