"use client"

import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { getNavigationByRole } from "@/config/navigation"
import { LogOut } from "lucide-react"
import logo from "/logo.svg"
import hat from "/hat.svg"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePeriodeFilter } from "@/hooks/usePeriodeFilter"

export function AppSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const { user, logout } = useAuth()
  const navigation = getNavigationByRole(user?.role, user?.is_responsable, user?.is_jury_president)
  const isMobile = useIsMobile()
  const { isVisible } = usePeriodeFilter()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div
      className={`text-white h-full ${isCollapsed ? "w-20" : "w-64"} flex flex-col shadow-2xl relative transition-all duration-300`}
    >
      {/* Header section - fixed height to maintain button position */}
      <div className={`flex items-center justify-center ${isMobile ? "p-4" : "p-6"} w-full min-h-[120px]`}>
        <div className="flex items-center justify-center w-full">
          <img
            src={isCollapsed ? (hat || "/placeholder.svg") : (logo || "/placeholder.svg")}
            alt="Logo"
            className={`${
              isCollapsed 
                ? "w-full max-w-[52px]" 
                : isMobile 
                  ? "w-16" 
                  : "w-24"
            } h-auto object-contain transition-all duration-300`}
          />
        </div>
      </div>
      <div className={`${isMobile ? "pb-8" : "pb-12"}`} />

      {/* Navigation Links - consistent positioning */}
      <div className="px-4 space-y-2 overflow-y-auto">
        {navigation.main.filter(item => isVisible(item.periodes)).map((item) => (
          <NavLink
            key={item.title}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) => `
              flex items-center ${isCollapsed ? "justify-center" : "gap-4 px-4"} py-3 rounded-xl transition-colors duration-200 group relative overflow-hidden
              ${isActive ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-slate-800 hover:text-white"}
            `}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`text-xl transition-colors duration-200 ${
                    isActive ? "text-slate-900" : "text-slate-400 group-hover:text-white"
                  }`}
                >
                  {<item.icon />}
                </span>
                {!isCollapsed && (
                  <span
                    className={`font-medium tracking-wide transition-colors duration-200 whitespace-nowrap ${
                      isActive ? "text-slate-900 font-semibold" : "group-hover:text-white"
                    }`}
                  >
                    {item.title}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {navigation.secondary &&
          navigation.secondary.filter(item => isVisible(item.periodes)).map((item) => (
            <NavLink
              key={item.title}
              to={item.href}
              end
              className={({ isActive }) => `
              flex items-center ${isCollapsed ? "justify-center" : "gap-4 px-4"} py-3 rounded-xl transition-colors duration-200 group relative overflow-hidden
              ${isActive ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-slate-800 hover:text-white"}
            `}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`text-xl transition-colors duration-200 ${
                      isActive ? "text-slate-900" : "text-slate-400 group-hover:text-white"
                    }`}
                  >
                    {<item.icon />}
                  </span>
                  {!isCollapsed && (
                    <span
                      className={`font-medium tracking-wide transition-colors duration-200 whitespace-nowrap ${
                        isActive ? "text-slate-900 font-semibold" : "group-hover:text-white"
                      }`}
                    >
                      {item.title}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
      </div>
      <div className="flex-1" />
      <div className={`${isMobile ? "pt-4" : "pt-6"}`} />

      {/* Footer section - keeping original position */}
      <div className="p-4 border-t border-slate-800">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            handleLogout()
          }}
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-4 px-4"} py-3 rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-colors duration-200`}
        >
          <LogOut className="text-xl" />
          {!isCollapsed && (
            <span className="font-medium transition-colors duration-200 whitespace-nowrap">Déconnexion</span>
          )}
        </a>
      </div>
    </div>
  )
}