"use client"

import React from 'react';
import { User, LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuth } from '@/app/context/AuthContext';
import { 
  SearchRounded,
  LightModeOutlined,
  DarkModeOutlined,
  PersonOutlineOutlined,
  KeyboardArrowDownOutlined,
  NotificationsOutlined
} from '@mui/icons-material';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/mapper_module':
      return 'Mapper Module';
    case '/home':
      return 'Data Management Dashboard';
    case '/jobs':
      return 'All Jobs';
    case '/type_mapper':
      return 'Type Mapper';
    case '/admin':
      return 'Admin Dashboard';
    case '/profile':
      return 'User Profile';
    case '/settings':
      return 'Settings';
    default:
      return 'Menu';
  }
};

const NavBar = ({ userProfile, showProfile, setShowProfile, sidebarOpen }) => {
  const { darkMode, setDarkMode } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const pageTitle = getPageTitle(pathname);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const profileRef = useClickOutside(() => {
    if (showProfile) setShowProfile(false);
  });
  
  const notificationRef = useClickOutside(() => {
    if (showNotifications) setShowNotifications(false);
  });

  const handleLogout = () => {
    logout();
    setShowProfile(false);
  };

  const handleViewProfile = () => {
    router.push('/profile');
    setShowProfile(false);
  };

  return (
    <nav className={`
      sticky top-0 z-30 w-full
      transition-all duration-300 ease-in-out
      border-b backdrop-blur-md
      ${darkMode 
        ? 'bg-gray-900/90 border-gray-800 shadow-lg shadow-gray-900/20' 
        : 'bg-white/90 border-gray-100 shadow-lg shadow-gray-200/30'}
    `}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section - Page Title */}
        <div className="flex items-center min-w-[180px]">
          <h1 className={`
            text-lg font-semibold tracking-wide relative
            ${darkMode ? 'text-gray-100' : 'text-gray-800'}
          `}>
            {pageTitle}
            <span className="absolute -bottom-1 left-0 w-10 h-0.5 bg-blue-500 rounded-full"></span>
          </h1>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative group">
            <div className={`
              absolute inset-y-0 left-3 flex items-center pointer-events-none
              transition-opacity group-focus-within:opacity-100 opacity-60
            `}>
              <SearchRounded className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className={`
                w-52 pl-9 pr-3 py-1.5 rounded-full text-xs transition-all duration-200
                border focus:ring-1 focus:outline-none
                ${darkMode 
                  ? 'bg-gray-800/70 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20' 
                  : 'bg-gray-50/80 border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20'
                }
                hover:shadow-md
              `}
            />
          </div>

          {/* Actions Container */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`
                  p-1.5 rounded-full transition-all duration-200 relative
                  ${darkMode 
                    ? 'hover:bg-gray-800 text-gray-300 hover:text-blue-400' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-blue-500'
                  }
                `}
              >
                <NotificationsOutlined className="w-4 h-4" />
                <span className="absolute top-0 right-0 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className={`
                  absolute right-0 mt-2 w-72 rounded-lg shadow-xl z-50
                  transform transition-all duration-200 origin-top-right
                  ${darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                  }
                `}>
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Notifications</h3>
                    <button className="text-xs text-blue-500 hover:text-blue-600">Mark all as read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {/* Example notifications */}
                    {[1, 2, 3].map((item) => (
                      <div key={item} className={`
                        p-2 border-b last:border-0 transition-colors hover:cursor-pointer
                        ${darkMode 
                          ? 'border-gray-700 hover:bg-gray-700/50' 
                          : 'border-gray-100 hover:bg-gray-50'
                        }
                      `}>
                        <div className="flex items-start">
                          <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2
                            ${item === 1 ? 'bg-blue-100 text-blue-500' : item === 2 ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'}
                          `}>
                            <Bell className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {item === 1 ? 'New job completed' : item === 2 ? 'Mapping successful' : 'System update'} 
                            </p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item === 1 
                                ? 'Job #45928 has been completed successfully.' 
                                : item === 2 
                                  ? 'Your data mapping has been validated and approved.' 
                                  : 'System maintenance scheduled for tomorrow.'}
                            </p>
                            <p className="text-xs text-blue-500 mt-0.5">{item * 10}m ago</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'} hover:underline`}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`
                p-1.5 rounded-full transition-all duration-200 hover:scale-105
                ${darkMode 
                  ? 'hover:bg-gray-800 text-gray-300 hover:text-yellow-400' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-blue-500'
                }
              `}
            >
              {darkMode ? 
                <LightModeOutlined className="w-4 h-4" /> : 
                <DarkModeOutlined className="w-4 h-4" />
              }
            </button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`
                  flex items-center space-x-2 px-2 py-1 rounded-full transition-all duration-200
                  ${darkMode 
                    ? 'hover:bg-gray-800 border border-transparent hover:border-gray-700' 
                    : 'hover:bg-gray-100 border border-transparent hover:border-gray-200'
                  }
                `}
              >
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center
                  bg-gradient-to-r from-blue-500 to-purple-500 text-white
                `}>
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email || 'User')}
                </span>
                <KeyboardArrowDownOutlined className={`
                  w-4 h-4 transition-transform duration-200
                  ${showProfile ? 'rotate-180' : 'rotate-0'}
                  ${darkMode ? 'text-gray-400' : 'text-gray-500'}
                `} />
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className={`
                  absolute right-0 mt-2 w-64 rounded-lg shadow-2xl z-50
                  transform transition-all duration-200 origin-top-right
                  ${darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                  }
                `}>
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold
                      `}>
                        {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user?.role || 'User'}
                        </p>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                          {user?.email || 'No email available'}
                        </p>
                      </div>
                    </div>
                    <div className={`pt-3 border-t space-y-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <button 
                        onClick={handleViewProfile}
                        className={`
                        w-full py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center space-x-2
                        ${darkMode 
                          ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }
                      `}>
                        <PersonOutlineOutlined className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className={`
                        w-full py-1.5 px-3 rounded-lg flex items-center justify-center space-x-2 text-xs transition-colors
                        ${darkMode 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                          : 'text-red-600 hover:bg-red-50'
                        }
                      `}>
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar; 