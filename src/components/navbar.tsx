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
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useDemo } from "@/components/providers/demo-provider";
import ProfilePicture from "@/components/ui/profile-picture";

export function Navbar() {
  const router = useRouter()
  const { isDemoMode, exitDemoMode } = useDemo()
  const [currentUser, setCurrentUser] = useState<any>(null)

  React.useEffect(() => {
    async function getCurrentUser() {
      if (!isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
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

  const links = [
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

  const [open, setOpen] = useState(false);
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10" logo={<Logo />}>
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon open={open} />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
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
        <div>
          <SidebarLink
            link={{
              label: "Profile",
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
      <img
        src="/gainerithmLogoWHITEBG.svg"
        alt="Gainerithm Logo"
        className="h-5 w-6 shrink-0 block dark:hidden"
        draggable="false"
      />
      <img
        src="/gainerithmlogoforBLACKBG.svg"
        alt="Gainerithm Logo Dark"
        className="h-5 w-6 shrink-0 hidden dark:block"
        draggable="false"
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
      <img
        src="/gainerithmLogoWHITEBG.svg"
        alt="Gainerithm Logo"
        className="h-5 w-5 shrink-0 block dark:hidden"
        draggable="false"
      />
      <img
        src="/gainerithmlogoforBLACKBG.svg"
        alt="Gainerithm Logo Dark"
        className="h-5 w-5 shrink-0 hidden dark:block"
        draggable="false"
      />
    </a>
  );
}; 