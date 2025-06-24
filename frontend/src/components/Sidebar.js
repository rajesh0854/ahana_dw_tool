"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, PieChart, FileSpreadsheet, Database, Settings, UserCog, Layers, Briefcase, ActivitySquare, LineChart } from 'lucide-react';

const SidebarItem = ({ icon, text, active = false, expanded = true, href }) => {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={href}>
      <motion.div 
        className={`
          flex items-center py-2.5 cursor-pointer
          ${active 
            ? darkMode 
              ? 'bg-gradient-to-r from-blue-600/30 to-indigo-500/20 text-blue-400' 
              : 'bg-gradient-to-r from-blue-100 to-indigo-100/50 text-blue-600' 
            : 'text-gray-500'}
          ${expanded ? 'px-4 rounded-xl mx-2' : 'rounded-full justify-center mx-auto w-10 h-10'}
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
          flex items-center ${expanded ? 'space-x-3' : 'justify-center'}
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
              size: expanded ? 18 : 20,
              className: `transition-all duration-200 ${active 
                ? darkMode ? 'text-blue-400' : 'text-blue-600' 
                : darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-600'}`
            })}
          </motion.div>
          
          {expanded && (
            <motion.span 
              className={`
                text-xs font-medium transition-all duration-200
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
              absolute ${expanded ? 'right-0 h-full w-1' : 'bottom-0 w-full h-1'} 
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
                animate={{ opacity: 1, x: 60, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={`
                  absolute left-0 whitespace-nowrap px-2 py-1 rounded-md text-xs font-medium z-50
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
        fixed top-0 left-0 h-full z-40
        ${darkMode 
          ? 'bg-gray-900/95 border-r border-gray-800' 
          : 'bg-white/95 border-r border-gray-100'}
        backdrop-blur-md
      `}
      initial={false}
      animate={{ 
        width: sidebarOpen ? '15rem' : '3.5rem'
      }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
    >
      {/* Logo Section */}
      <div className={`
        h-14 flex items-center justify-center px-3 border-b
        ${darkMode ? 'border-gray-800' : 'border-gray-100'}
      `}>
        <motion.div 
          className="relative"
          animate={{ 
            width: sidebarOpen ? '10rem' : '3.5rem',
            height: '2.5rem'
          }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
        >
          <Image
            src="/ahana-logo.svg"
            alt="Ahana Logo"
            fill
            className="object-contain p-1"
            priority
          />
        </motion.div>
      </div>

      {/* Main Navigation */}
      <nav className="mt-4 px-1 space-y-0.5">
        <SidebarItem 
          icon={<LayoutDashboard />} 
          text="Home" 
          active={pathname === '/home'} 
          expanded={sidebarOpen}
          href="/home"
        />

        <SidebarItem 
          icon={<Briefcase />} 
          text="Mapper Module" 
          active={pathname === '/mapper_module'} 
          expanded={sidebarOpen}
          href="/mapper_module"
        /> 

        <SidebarItem 
          icon={<FileSpreadsheet />} 
          text="Manage Jobs" 
          active={pathname === '/jobs'} 
          expanded={sidebarOpen}
          href="/jobs"
        /> 

        <SidebarItem 
          icon={<ActivitySquare />} 
          text="Logs & Status" 
          active={pathname === '/job_status_and_logs'} 
          expanded={sidebarOpen}
          href="/job_status_and_logs"
        />

        <SidebarItem 
          icon={<LineChart />} 
          text="Dashboard" 
          active={pathname === '/dashboard'} 
          expanded={sidebarOpen}
          href="/dashboard"
        />

  
        <SidebarItem 
          icon={<Database />} 
          text="Type Mapping" 
          active={pathname === '/type_mapper'} 
          expanded={sidebarOpen}
          href="/type_mapper"
        />

        <SidebarItem 
          icon={<Settings />} 
          text="Admin Module" 
          active={pathname === '/admin'} 
          expanded={sidebarOpen}
          href="/admin"
        />  

        <SidebarItem 
          icon={<UserCog />} 
          text="User Profile" 
          active={pathname === '/profile'} 
          expanded={sidebarOpen}
          href="/profile"
        />

      </nav>

      {/* Toggle Button */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`
            p-2 rounded-full
            ${darkMode 
              ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-400 hover:text-blue-300 border border-blue-800/40' 
              : 'bg-gradient-to-br from-blue-100 to-indigo-100/70 text-blue-600 hover:text-blue-500 border border-blue-200/70'}
            shadow-md
          `}
          whileHover={{ 
            scale: 1.05,
            rotate: sidebarOpen ? -3 : 3,
            transition: { duration: 0.15 }
          }}
          whileTap={{ scale: 0.95 }}
        >
          {sidebarOpen ? 
            <ChevronLeft size={18} /> : 
            <ChevronRight size={18} />
          }
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar; 