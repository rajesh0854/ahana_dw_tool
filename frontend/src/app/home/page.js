'use client'
import React, { useState } from 'react'
import { Card, CardContent, Typography, Grid, Box, Container, Paper, useMediaQuery, Divider } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import { useTheme } from '@/context/ThemeContext'
import { motion } from 'framer-motion'
import { AdminPanelSettings, Storage, Timeline, AutoFixHigh, Shield } from '@mui/icons-material'

const Page = () => {
  const router = useRouter()
  const { darkMode } = useTheme()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const [hoveredCard, setHoveredCard] = useState(null)

  const cards = [
    {
      title: 'Data Mapper',
      path: '/mapper_module',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Map and transform your data structures efficiently',
      icon: <Storage sx={{ fontSize: '2.5rem', color: '#fff' }} />,
      delay: 0
    },
    {
      title: 'Jobs',
      path: '/jobs',
      gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
      description: 'Manage and monitor your processing jobs',
      icon: <Timeline sx={{ fontSize: '2.5rem', color: '#fff' }} />,
      delay: 0.1
    },
    {
      title: 'Parameter Mapping',
      path: '/type_mapper',
      gradient: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
      description: 'Convert and validate data types seamlessly',
      icon: <AutoFixHigh sx={{ fontSize: '2.5rem', color: '#fff' }} />,
      delay: 0.2
    },
    {
      title: 'Admin',
      path: '/admin',
      gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
      description: 'Manage users, roles and system settings',
      icon: <AdminPanelSettings sx={{ fontSize: '2.5rem', color: '#fff' }} />,
      delay: 0.3
    }
  ]

  // Animation variants for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  }

  const headerVariants = {
    hidden: { y: -30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 20 
      } 
    }
  }

  return (
    <div className={`p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <Paper
        elevation={3}
        className={`relative min-h-[calc(100vh-4rem)] ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-xl shadow-xl overflow-hidden`}
      >
        {/* Background pattern for visual interest */}
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: darkMode 
              ? `radial-gradient(circle at 20% 30%, rgba(80, 80, 120, 0.15) 0%, transparent 40%),
                 radial-gradient(circle at 80% 70%, rgba(90, 90, 160, 0.1) 0%, transparent 50%)`
              : `radial-gradient(circle at 20% 30%, rgba(100, 130, 255, 0.07) 0%, transparent 40%),
                 radial-gradient(circle at 80% 70%, rgba(0, 200, 255, 0.05) 0%, transparent 50%)`,
            zIndex: 0
          }}
        />

        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, zIndex: 1, position: 'relative' }}>
          {/* Header with title */}
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
          >
            <Box sx={{ mb: 5, textAlign: 'center' }}>
              <Typography 
                variant="h3" 
                component="h1"
                sx={{ 
                  fontWeight: 800, 
                  mb: 2,
                  background: darkMode 
                    ? 'linear-gradient(to right, #9face6, #74ebd5)'
                    : 'linear-gradient(to right, #5a67d8, #2b6cb0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '4px',
                    background: darkMode 
                      ? 'linear-gradient(to right, #9face6, #74ebd5)'
                      : 'linear-gradient(to right, #5a67d8, #2b6cb0)',
                    borderRadius: '2px'
                  }
                }}
              >
                Data Warehouse Tool
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  maxWidth: '700px',
                  mx: 'auto',
                  mt: 4,
                  fontSize: '1.1rem'
                }}
              >
                Access powerful tools to transform and manage your data efficiently
              </Typography>
            </Box>
          </motion.div>

          {/* Feature highlights */}
          <Box 
            sx={{ 
              mb: 6, 
              mt: 6,
              px: { xs: 2, md: 6 }, 
              py: 3,
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(240, 245, 255, 0.6)',
              borderRadius: 4,
              border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={4} md={4}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Shield sx={{ fontSize: '2.5rem', color: darkMode ? '#90cdf4' : '#3182ce', mb: 1 }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                    Secure & Reliable
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
                    Enterprise-grade security with role-based access controls
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Timeline sx={{ fontSize: '2.5rem', color: darkMode ? '#9ae6b4' : '#48bb78', mb: 1 }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                    Real-time Analytics
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
                    Monitor progress and performance metrics instantly
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <AutoFixHigh sx={{ fontSize: '2.5rem', color: darkMode ? '#fbd38d' : '#ed8936', mb: 1 }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                    Intelligent Mapping
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
                    AI-powered suggestions for faster data transformations
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Cards Grid */}
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              fontWeight: 600, 
              textAlign: 'center',
              color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
            }}
          >
            Access Your Tools
          </Typography>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div 
                    variants={cardVariants}
                    transition={{ delay: card.delay }}
                  >
                    <Card
                      component={motion.div}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: darkMode 
                          ? '0 15px 35px rgba(0,0,0,0.4)' 
                          : '0 15px 35px rgba(0,0,0,0.15)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => router.push(card.path)}
                      sx={{
                        height: { xs: 180, md: 200 },
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 4,
                        border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                        boxShadow: darkMode ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 25px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease-in-out',
                      }}
                      className={darkMode ? 'bg-gray-800' : ''}
                    >
                      <Box
                        sx={{
                          background: card.gradient,
                          height: '100%',
                          width: '100%',
                          position: 'absolute',
                          opacity: darkMode ? 0.9 : 0.95,
                          transition: 'transform 0.5s ease-out',
                          transform: hoveredCard === index ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />

                      {/* Glass-like overlay effect */}
                      <Box
                        sx={{
                          background: darkMode 
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)' 
                            : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                          backdropFilter: 'blur(2px)',
                          height: '100%',
                          width: '100%',
                          position: 'absolute',
                          opacity: hoveredCard === index ? 1 : 0,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                      />

                      <CardContent
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          zIndex: 1,
                          p: { xs: 2, md: 3 }
                        }}
                      >
                        <motion.div
                          animate={{ 
                            scale: hoveredCard === index ? 1.1 : 1,
                            y: hoveredCard === index ? -8 : 0
                          }}
                          transition={{ duration: 0.3 }}
                          style={{ marginBottom: '12px' }}
                        >
                          {card.icon}
                        </motion.div>
                        <Typography
                          variant="h6"
                          component="div"
                          align="center"
                          sx={{
                            color: '#fff',
                            fontWeight: 600,
                            mb: 1,
                            letterSpacing: '0.3px'
                          }}
                        >
                          {card.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          align="center"
                          sx={{
                            color: 'rgba(255,255,255,0.95)',
                            fontWeight: 400,
                            lineHeight: 1.4,
                            fontSize: { xs: '0.8rem', md: '0.875rem' },
                            maxWidth: '95%'
                          }}
                        >
                          {card.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Footer Section */}
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Divider sx={{ 
              mb: 4, 
              opacity: darkMode ? 0.1 : 0.2,
              maxWidth: '500px',
              mx: 'auto'
            }} />
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2025 Ahana Systems & Solutions Pvt Ltd | All Rights Reserved
            </Typography>
          </Box>
        </Container>
      </Paper>
    </div>
  )
}

export default Page