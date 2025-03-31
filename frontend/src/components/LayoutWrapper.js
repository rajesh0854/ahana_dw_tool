"use client"

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import NavBar from './NavBar';
import { useTheme } from '@/context/ThemeContext';

export default function LayoutWrapper({ children }) {
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const pathname = usePathname();
  
  // Check if the current route is an auth route
  const isAuthRoute = pathname?.startsWith('/auth/');
  
  // For auth routes, render only the children without layout elements
  if (isAuthRoute) {
    return children;
  }

  // For non-auth routes, render with the full layout (sidebar and navbar)
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111111]' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <NavBar 
          showProfile={showProfile}
          setShowProfile={setShowProfile}
          sidebarOpen={sidebarOpen}
        />
        <div className="pt-16">
          {children}
        </div>
      </div>
    </div>
  );
} 