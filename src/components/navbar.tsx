"use client"

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  BarChart3,
  Settings,
  User,
  LogOut,
  Dumbbell,
  Users,
  Search,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useDemo } from "@/components/providers/demo-provider";
import ProfilePicture from "@/components/ui/profile-picture";
import OptimizedImage from "./ui/optimized-image";

export function Navbar() {
  const router = useRouter()
  const { isDemoMode, exitDemoMode } = useDemo()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [username, setUsername] = useState<string | null>(null)

  React.useEffect(() => {
    async function getCurrentUser() {
      if (!isDemoMode) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          setCurrentUser(user)
          
          // Fetch notification count and username in parallel for better performance
          if (user) {
            const [notificationResponse, profileResponse] = await Promise.all([
              fetch('/api/notifications/count'),
              supabase
                .from('user_profiles')
                .select('username')
                .eq('user_id', user.id)
                .single()
            ])

            // Handle notification count
            if (notificationResponse.ok) {
              const { count } = await notificationResponse.json()
              setNotificationCount(count)
            }

            // Handle username
            if (profileResponse.data) {
              setUsername(profileResponse.data.username)
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }
    }
    getCurrentUser()
  }, [isDemoMode])

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode()
      router.push('/')
      router.refresh()
    } else {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  const desktopLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <BarChart3 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Workout",
      href: "/workout",
      icon: (
        <Dumbbell className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Feed",
      href: "/feed",
      icon: (
        <Users className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Search",
      href: "/search",
      icon: (
        <Search className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: (
        <div className="relative">
          <Bell className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </div>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <User className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  const mobileLinks = [
    {
      label: "Notifications",
      href: "/notifications",
      icon: (
        <div className="relative">
          <Bell className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </div>
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10" logo={<Logo />}>
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon open={open} />}
          <div className="mt-8 flex flex-col gap-2">
            {/* Desktop sidebar shows all links */}
            <div className="hidden md:block">
              {desktopLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            {/* Mobile sidebar shows only Profile and Settings */}
            <div className="md:hidden">
              {mobileLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-start gap-2 group/sidebar py-2 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              <LogOut className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                {isDemoMode ? 'Exit Demo' : 'Logout'}
              </motion.span>
            </button>
          </div>
        </div>
        <div className="hidden md:block">
          <SidebarLink
            link={{
              label: username ? `@${username}` : "Profile",
              href: "/profile",
              icon: (
                <ProfilePicture
                  userId={currentUser?.id}
                  size="sm"
                  className="shrink-0"
                />
              ),
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  const { isDemoMode } = useDemo()
  
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <OptimizedImage
        src="/gainerithmLogoWHITEBG.svg"
        alt="Gainerithm Logo"
        width={24}
        height={20}
        className="h-5 w-6 shrink-0 block dark:hidden"
        priority
      />
      <OptimizedImage
        src="/gainerithmlogoforBLACKBG.svg"
        alt="Gainerithm Logo Dark"
        width={24}
        height={20}
        className="h-5 w-6 shrink-0 hidden dark:block"
        priority
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        gainerithm
      </motion.span>
      {isDemoMode && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs bg-gradient-to-r from-blue-800 to-purple-800 text-white px-2 py-1 rounded-full"
        >
          DEMO
        </motion.span>
      )}
    </a>
  );
};

export const LogoIcon = ({ open }: { open: boolean }) => {
  return (
    <a
      href="/dashboard"
      className="flex items-center py-2"
    >
      <OptimizedImage
        src="/gainerithmLogoWHITEBG.svg"
        alt="Gainerithm Logo"
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 block dark:hidden"
        priority
      />
      <OptimizedImage
        src="/gainerithmlogoforBLACKBG.svg"
        alt="Gainerithm Logo Dark"
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 hidden dark:block"
        priority
      />
    </a>
  );
}; 