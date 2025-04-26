'use client';
import { Box, Container } from '@mui/material';

export default function AdminLayout({ children, about, license, 'manage-users': manageUsers }) {
    return (
        <Box sx={{ 
            width: '100%', 
            maxWidth: '100%',
            overflowX: 'hidden',
            pb: 4
        }}>
            <Container 
                maxWidth={false} 
                sx={{ 
                    px: { xs: 2, sm: 3, md: 4 }, 
                    py: 2,
                    maxWidth: '100%'
                }}
            >
                {children}
                {about}
                {license}
                {manageUsers}
            </Container>
        </Box>
    );
} 