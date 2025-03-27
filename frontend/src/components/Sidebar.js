"use client"

import React from 'react';
import { ChevronLeft, ChevronRight, Home, Video, Layout, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

const SidebarItem = ({ icon, text, active = false, expanded = true, href }) => {
  const { darkMode } = useTheme();
  
  return (
    <Link href={href}>
      <div className={`
        flex items-center px-5 py-3.5 cursor-pointer transition-all duration-300 ease-in-out
        ${active 
          ? darkMode 
            ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/20 border-r-4 border-blue-500' 
            : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-r-4 border-blue-500' 
          : 'hover:bg-opacity-80'}
        ${expanded ? 'mx-3 rounded-xl' : 'mx-2 rounded-lg justify-center'}
        ${darkMode 
          ? 'hover:bg-gray-800/70' 
          : 'hover:bg-blue-50/70'}
        transform hover:translate-x-1 hover:shadow-sm
      `}>
        <div className={`flex items-center ${expanded ? 'space-x-4' : 'justify-center'}`}>
          {React.cloneElement(icon, { 
            size: 22,
            className: `${active 
              ? darkMode ? 'text-blue-400' : 'text-blue-600' 
              : darkMode ? 'text-gray-400' : 'text-gray-500'} 
              transition-all duration-200`
          })}
          {expanded && (
            <span className={`
              ${active 
                ? darkMode ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold' 
                : darkMode ? 'text-gray-300' : 'text-gray-600'}
              text-sm font-medium transition-all duration-200
            `}>
              {text}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { darkMode } = useTheme();
  const pathname = usePathname();

  return (
    <div className={`
      fixed top-0 left-0 h-full shadow-lg transition-all duration-300 ease-in-out z-50
      ${darkMode 
        ? 'bg-gray-900 border-gray-800 shadow-gray-950/30' 
        : 'bg-white border-gray-100 shadow-blue-100/50'}
      ${sidebarOpen ? 'w-64' : 'w-20'}
      backdrop-blur-sm
    `}>
      <div className={`
        relative h-20 flex items-center justify-between px-4 border-b
        ${darkMode ? 'border-gray-800' : 'border-gray-100'}
      `}>
        <div className={`flex items-center justify-center ${sidebarOpen ? 'w-48' : 'w-full'}`}>
          <div className={`relative transition-all duration-300 ${sidebarOpen ? 'w-48 h-14' : 'w-14 h-14'}`}>
            <Image
              src="https://www.ahana.co.in/wp-content/uploads/2024/03/New1-Ahana-2024-website-Logo-Medium.svg"
              alt="Ahana Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`
            p-2 rounded-full transition-all duration-300 ease-in-out
            ${darkMode 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-blue-400' 
              : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'}
            ${!sidebarOpen ? 'absolute right-2' : ''}
            transform hover:scale-110
          `}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? 
            <ChevronLeft size={20} /> : 
            <ChevronRight size={20} />
          }
        </button>
      </div>
      
      <nav className="mt-8 space-y-3 px-2">
        <SidebarItem 
          icon={<Home />} 
          text="Home" 
          active={pathname === '/home'} 
          expanded={sidebarOpen}
          href="/home"
        />

        <SidebarItem 
          icon={<Layout />} 
          text="Mapper Module" 
          active={pathname === '/mapper_module'} 
          expanded={sidebarOpen}
          href="/mapper_module"
        /> 

        <SidebarItem 
          icon={<Layout />} 
          text="Type Mapping Module" 
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
          icon={<Users />} 
          text="User Profile" 
          active={pathname === '/profile'} 
          expanded={sidebarOpen}
          href="/profile"
        />  

      </nav>

      {sidebarOpen && (
        <div className={`absolute bottom-8 left-0 right-0 px-6 py-4 mx-3 rounded-xl
          ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50/80'}
        `}>
          <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Data Warehouse Tool
          </h4>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            v1.0.0
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 