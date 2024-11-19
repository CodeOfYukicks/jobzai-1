"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLocation } from 'react-router-dom'

interface ThemeToggleProps {
  className?: string;
  forceShow?: boolean;
}

export function ThemeToggle({ className = "", forceShow = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const location = useLocation()

  if (!forceShow && location.pathname !== '/') {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`relative w-16 h-8 rounded-full bg-gray-200 dark:bg-[#2A2831]/80 backdrop-blur-sm transition-all duration-200 ${className}`}
    >
      <div className="absolute inset-1 flex items-center">
        <div 
          className={`w-6 h-6 bg-white dark:bg-[#2A2831] rounded-full flex items-center justify-center transition-transform duration-200 ${
            theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
          }`}
        >
          <Sun className="h-4 w-4 text-[#4D3E78] absolute rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
          <Moon className="h-4 w-4 text-white absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </div>
      </div>
    </button>
  )
} 