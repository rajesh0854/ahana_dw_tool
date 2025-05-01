import React from 'react';
import { Box, Typography, Divider, Avatar, useTheme, Link, Stack, IconButton, Grid, Paper, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';

const AboutTabContent = () => {
    const theme = useTheme();

    // Define a reusable style for section containers
    const sectionPaperStyle = {
        p: 3,
        borderRadius: 2, // Softer corners
        // Use Paper elevation or define a custom shadow/border
        // boxShadow: theme.shadows[2],
        border: `1px solid ${theme.palette.divider}`,
        // Or use background color for distinction
        // backgroundColor: alpha(theme.palette.primary.main, 0.03),
        mb: 4, // Spacing between sections
    };

    return (
        <Box sx={{
            p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
            bgcolor: theme.palette.background.default, // Use theme background
            flexGrow: 1, // Ensure it tries to fill available vertical space if needed
        }}>

            {/* --- Header Section --- */}
            <Paper elevation={0} sx={{ ...sectionPaperStyle, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item>
                        <Avatar sx={{
                            bgcolor: theme.palette.primary.main,
                            width: { xs: 60, sm: 70 }, // Slightly larger avatar
                            height: { xs: 60, sm: 70 },
                            fontSize: '2rem',
                            boxShadow: theme.shadows[3]
                        }}>
                            A
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h4" component="h1" fontWeight="bold" color="primary.dark">
                            Ahana DW Tool
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Data Warehouse Management System
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- Details Grid --- */}
            <Grid container spacing={4} sx={{ mt: 1 }}>

                {/* --- Company Details Section --- */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={sectionPaperStyle}>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                           <BusinessIcon color="primary"/>
                           <Typography variant="h6" fontWeight="medium" color="primary.main">
                                About the Company
                           </Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight="medium" gutterBottom>
                           Ahana Systems & Solutions Pvt Ltd
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                           "Creating Possibilities"
                        </Typography>
                         <Divider sx={{ my: 2 }} />
                         <Stack direction="row" spacing={1} alignItems="center">
                             <LanguageIcon fontSize="small" color="action"/>
                             <Link
                                href="https://www.ahanait.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                underline="hover"
                            >
                                www.ahanait.com
                            </Link>
                         </Stack>
                         <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                             <EmailIcon fontSize="small" color="action"/>
                             <Link
                                href="mailto:info@ahanait.co.in"
                                variant="body2"
                                underline="hover"
                             >
                                 info@ahanait.co.in
                            </Link>
                         </Stack>
                    </Paper>
                </Grid>

                {/* --- Version & Status Section --- */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={sectionPaperStyle}>
                         <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                           <InfoOutlinedIcon color="primary"/>
                           <Typography variant="h6" fontWeight="medium" color="primary.main">
                                Application Info
                           </Typography>
                        </Stack>
                        <Grid container spacing={1} alignItems="baseline">
                             <Grid item>
                                <Typography variant="body1" fontWeight="medium">Version:</Typography>
                             </Grid>
                             <Grid item>
                                <Typography variant="body1" >1.0.0</Typography>
                             </Grid>
                         </Grid>
                          <Grid container spacing={1} alignItems="center" mt={1}>
                              <Grid item>
                                <Typography variant="body1" fontWeight="medium">Status:</Typography>
                             </Grid>
                             <Grid item>
                                <Box sx={{
                                    display: 'inline-flex', // Use inline-flex
                                    alignItems: 'center',
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.dark,
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 0.5,
                                    ml: 0 // Remove margin left
                                }}>
                                    <VerifiedIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    <Typography variant="body2" fontWeight="medium">Up to date</Typography>
                                </Box>
                            </Grid>
                        </Grid>

                         <Divider sx={{ my: 2 }} />
                         <Typography variant="body2" color="text.secondary">
                           Last Checked: {new Date().toLocaleDateString()}
                         </Typography>

                    </Paper>
                </Grid>

                 {/* --- Connect With Us Section --- */}
                 <Grid item xs={12}>
                     <Paper elevation={0} sx={sectionPaperStyle}>
                         <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                             <ConnectWithoutContactIcon color="primary"/>
                           <Typography variant="h6" fontWeight="medium" color="primary.main">
                                Connect With Us
                           </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                           Follow us on our social channels for updates and news.
                        </Typography>

                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap"> {/* Use wrap for smaller screens */}
                            <Tooltip title="Website">
                                <IconButton
                                    component={Link}
                                    href="https://www.ahanait.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Visit Ahana Website"
                                    sx={{
                                        color: theme.palette.text.primary, // Use primary text for general icons
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                     }}
                                >
                                    <LanguageIcon />
                                </IconButton>
                             </Tooltip>

                             <Tooltip title="Send Email">
                                <IconButton
                                    component={Link}
                                    href="mailto:info@ahanait.co.in"
                                    aria-label="Send Email to Ahana"
                                    sx={{
                                         color: theme.palette.text.primary,
                                         '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                    }}
                                >
                                    <EmailIcon />
                                </IconButton>
                            </Tooltip>

                             <Tooltip title="LinkedIn">
                                <IconButton
                                    component={Link}
                                    href="https://www.linkedin.com/company/ahana-systems-solutions/" // Use actual link if known
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Ahana on LinkedIn"
                                    sx={{ color: '#0077B5', '&:hover': { bgcolor: alpha('#0077B5', 0.1) } }}
                                >
                                    <LinkedInIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Twitter">
                                <IconButton
                                    component={Link}
                                    href="https://twitter.com/ahana_it" // Use actual link if known
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Ahana on Twitter"
                                     sx={{ color: '#1DA1F2', '&:hover': { bgcolor: alpha('#1DA1F2', 0.1) } }}
                                >
                                    <TwitterIcon />
                                </IconButton>
                             </Tooltip>

                             <Tooltip title="GitHub">
                                <IconButton
                                    component={Link}
                                    href="https://github.com/ahana-systems" // Use actual link if known
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Ahana on GitHub"
                                    sx={{
                                         color: theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[800], // Adjust GitHub icon color for theme
                                         '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.1) }
                                    }}
                                >
                                    <GitHubIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                     </Paper>
                 </Grid>

            </Grid>

            {/* --- Footer --- */}
            <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" align="center" component="p">
                    © {new Date().getFullYear()} Ahana Systems & Solutions Pvt Ltd. All rights reserved.
                </Typography>
                 <Typography variant="caption" color="text.secondary" align="center" component="p" sx={{ mt: 0.5 }}>
                     Ahana DW Tool v1.0.0
                </Typography>
            </Box>
        </Box>
    );
};

export default AboutTabContent;