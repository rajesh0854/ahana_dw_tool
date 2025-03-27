"use client"

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Home, BarChart2, FileText, Database, Settings, User, Layers, PanelRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon, text, active = false, expanded = true, href }) => {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={href}>
      <motion.div 
        className={`
          flex items-center py-3.5 cursor-pointer
          ${active 
            ? darkMode 
              ? 'bg-gradient-to-r from-blue-600/30 to-indigo-500/20 text-blue-400' 
              : 'bg-gradient-to-r from-blue-100 to-indigo-100/50 text-blue-600' 
            : 'text-gray-500'}
          ${expanded ? 'px-6 rounded-xl mx-3' : 'rounded-full justify-center mx-auto w-12 h-12'}
          ${darkMode 
            ? 'hover:bg-gray-800/70 hover:text-blue-400' 
            : 'hover:bg-blue-50/70 hover:text-blue-600'}
          group relative
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ 
          x: expanded ? 4 : 0, 
          y: expanded ? 0 : -2,
          transition: { duration: 0.2 } 
        }}
        animate={{ 
          scale: active ? 1.02 : 1,
          transition: { duration: 0.2 }
        }}
      >
        <div className={`
          flex items-center ${expanded ? 'space-x-4' : 'justify-center'}
          ${active && 'font-medium'}
        `}>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ 
              rotate: isHovered ? active ? [0, -10, 0] : [0, 15, 0] : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut",
              scale: { duration: 0.2 }
            }}
          >
            {React.cloneElement(icon, { 
              size: expanded ? 22 : 24,
              className: `transition-all duration-200 ${active 
                ? darkMode ? 'text-blue-400' : 'text-blue-600' 
                : darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-600'}`
            })}
          </motion.div>
          
          {expanded && (
            <motion.span 
              className={`
                text-sm font-medium transition-all duration-200
                ${active 
                  ? darkMode ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold' 
                  : darkMode ? 'text-gray-300' : 'text-gray-600'}
              `}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {text}
            </motion.span>
          )}
        </div>
        
        {active && (
          <motion.div 
            className={`
              absolute ${expanded ? 'right-0 h-full w-1.5' : 'bottom-0 w-full h-1.5'} 
              bg-blue-500 ${expanded ? 'rounded-l-full top-0' : 'rounded-t-full left-0'}
            `}
            initial={{ 
              scaleY: expanded ? 0 : 1,
              scaleX: expanded ? 1 : 0,
              opacity: 0 
            }}
            animate={{ 
              scaleY: 1, 
              scaleX: 1,
              opacity: 1 
            }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {!expanded && !active && (
          <motion.div 
            className={`
              absolute left-0 top-0 w-full h-full rounded-full
              ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}
              opacity-0 group-hover:opacity-10
            `}
            initial={{ scale: 0 }}
            whileHover={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {!expanded && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 70, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={`
                  absolute left-0 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium z-50
                  ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} 
                  shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                `}
              >
                {text}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </Link>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { darkMode } = useTheme();
  const pathname = usePathname();

  return (
    <motion.div 
      className={`
        fixed top-0 left-0 h-full z-50
        ${darkMode 
          ? 'bg-gray-900/95 border-r border-gray-800' 
          : 'bg-white/95 border-r border-gray-100'}
        ${sidebarOpen ? 'w-72' : 'w-24'}
        backdrop-blur-md
      `}
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: sidebarOpen ? '18rem' : '6rem',
      }}
      transition={{ 
        duration: 0.4, 
        type: "spring", 
        width: { duration: 0.3 }
      }}
    >
      {/* Logo Section */}
      <div className={`
        h-24 flex items-center justify-center px-4 border-b
        ${darkMode ? 'border-gray-800' : 'border-gray-100'}
      `}>
        <motion.div 
          className={`relative ${sidebarOpen ? 'w-48 h-12' : 'w-16 h-16'}`}
          animate={{ 
            width: sidebarOpen ? '12rem' : '4rem',
            height: sidebarOpen ? '3rem' : '4rem'
          }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src="https://www.ahana.co.in/wp-content/uploads/2024/03/New1-Ahana-2024-website-Logo-Medium.svg"
            alt="Ahana Logo"
            fill
            className="object-contain p-1"
            priority
          />
        </motion.div>
      </div>
      
      {/* Main Navigation */}
      <div className="flex flex-col h-[calc(100%-24px)] justify-between">
        <nav className="mt-8 space-y-1.5 px-3">
          <SidebarItem 
            icon={<Home />} 
            text="Home" 
            active={pathname === '/home'} 
            expanded={sidebarOpen}
            href="/home"
          />

          <SidebarItem 
            icon={<Layers />} 
            text="Mapper Module" 
            active={pathname === '/mapper_module'} 
            expanded={sidebarOpen}
            href="/mapper_module"
          /> 

          <SidebarItem 
            icon={<FileText />} 
            text="All Jobs" 
            active={pathname === '/jobs'} 
            expanded={sidebarOpen}
            href="/jobs"
          /> 

          <SidebarItem 
            icon={<Database />} 
            text="Type Mapping" 
            active={pathname === '/type_mapper'} 
            expanded={sidebarOpen}
            href="/type_mapper"
          />

          <SidebarItem 
            icon={<PanelRight />} 
            text="Admin Module" 
            active={pathname === '/admin'} 
            expanded={sidebarOpen}
            href="/admin"
          />  

          <SidebarItem 
            icon={<User />} 
            text="User Profile" 
            active={pathname === '/profile'} 
            expanded={sidebarOpen}
            href="/profile"
          />  
        </nav>

        {/* Toggle Button & Footer Info */}
        <div className="mb-8 px-3">
          {/* Toggle Button - Positioned in the middle */}
          <div className="flex justify-center mb-6">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`
                p-3 rounded-full
                ${darkMode 
                  ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-400 hover:text-blue-300 border border-blue-800/40' 
                  : 'bg-gradient-to-br from-blue-100 to-indigo-100/70 text-blue-600 hover:text-blue-500 border border-blue-200/70'}
                shadow-md
              `}
              whileHover={{ 
                scale: 1.1,
                rotate: sidebarOpen ? -5 : 5,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                backgroundColor: darkMode 
                  ? sidebarOpen ? 'rgba(30, 64, 175, 0.2)' : 'rgba(30, 64, 175, 0.15)'
                  : sidebarOpen ? 'rgba(219, 234, 254, 0.9)' : 'rgba(219, 234, 254, 0.7)'
              }}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? 
                <ChevronLeft size={22} /> : 
                <ChevronRight size={22} />
              }
            </motion.button>
          </div>

          {/* Footer Info */}
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div 
                key="expanded-footer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className={`
                  px-6 py-4 mx-1 rounded-xl
                  ${darkMode 
                    ? 'bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-gray-700/50' 
                    : 'bg-gradient-to-br from-blue-50/90 to-indigo-50/40 border border-blue-100/50'}
                  shadow-sm
                `}
              >
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  DW Tool v1.0
                </h4>
                <div className={`text-xs flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <BarChart2 size={12} />
                  <span>v1.0.0</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="collapsed-footer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <motion.div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${darkMode 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300 border border-gray-700/50' 
                      : 'bg-gradient-to-br from-gray-50 to-blue-50/30 text-gray-600 border border-gray-200/70'}
                    shadow-sm
                  `}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-xs font-medium">v1.0</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar; 