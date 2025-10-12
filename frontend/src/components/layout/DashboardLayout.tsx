import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppSidebar } from '@/components/app-sidebar'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { NotificationBell } from '@/components/notifications'

interface DashboardLayoutProps {
  children?: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const [isLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isMobile = useIsMobile()

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur'
      case 'etudiant': return 'Étudiant'
      case 'enseignant': return 'Enseignant'
      case 'entreprise': return 'Entreprise'
      default: return role
    }
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-950 font-sans">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-gray-700 dark:text-gray-200 font-medium">Chargement...</p>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div className={`fixed z-50 h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-white w-64 flex-shrink-0 flex flex-col shadow-2xl h-full">
            <AppSidebar isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl h-screen">
          <AppSidebar isCollapsed={isCollapsed} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 shadow-lg border-b border-gray-200 dark:border-slate-700 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 w-full">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Left Section - Menu + Welcome */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              
              {/* Desktop Collapse Button */}
              {!isMobile && (
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 rounded-md bg-gray-200/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 flex-shrink-0 transition-colors duration-200"
                  aria-label="Toggle sidebar"
                >
                  {isCollapsed ? <PanelLeftOpen className="w-4 h-4 sm:w-5 sm:h-5" /> : <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 flex-shrink-0 transition-colors duration-200"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              
              {/* Welcome Message */}
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                  Bienvenue {isMobile ? '' : 'Cher'} {getRoleDisplayName(user?.role || '')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  Gérez votre espace de travail depuis ce tableau de bord
                </p>
              </div>
            </div>

            {/* Right Section - Actions & User */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 flex-shrink-0">
              {/* Notifications */}
              <NotificationBell />

              {/* User Profile */}
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 bg-gray-50 dark:bg-slate-800 rounded-full px-1.5 sm:px-2 lg:px-4 py-1 lg:py-2 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                {/* User name - hidden on very small screens */}
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm hidden sm:block max-w-20 md:max-w-none truncate order-1 lg:order-none">
                  {user?.name}
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-10 lg:h-10 rounded-full overflow-hidden border-2 border-orange-200 dark:border-orange-900 flex-shrink-0 shadow-md">
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={`${user?.name} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white dark:bg-slate-900 overflow-auto p-3 sm:p-4 md:p-6 pt-0">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-lg h-full overflow-y-auto">
            <div className="p-4 md:p-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}