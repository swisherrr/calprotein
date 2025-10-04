"use client"

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  Dumbbell,
  BarChart3,
  History,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDemo } from "@/components/providers/demo-provider";
import ProfilePicture from "@/components/ui/profile-picture";

export function MobileBottomNavbar() {
  const pathname = usePathname();
  const { isDemoMode } = useDemo();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function getCurrentUser() {
      if (!isDemoMode) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          setCurrentUser(user);
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    }
    getCurrentUser();
  }, [isDemoMode]);

  const navItems = [
    {
      label: "Feed",
      href: "/feed",
      icon: Users,
      isActive: pathname === "/feed",
    },
    {
      label: "Search",
      href: "/search",
      icon: Search,
      isActive: pathname === "/search",
    },
    {
      label: "Profile",
      href: "/profile",
      icon: ProfilePicture,
      isActive: pathname === "/profile",
    },
    {
      label: "Workout",
      href: "/workout",
      icon: Dumbbell,
      isActive: pathname === "/workout",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      isActive: pathname === "/dashboard",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black pink:bg-pink-50 border-t border-gray-200 dark:border-gray-800 pink:border-pink-200 z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          return (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center justify-center py-3 px-4 rounded-lg transition-colors duration-200",
                item.isActive
                  ? "text-blue-600 dark:text-blue-400 pink:text-pink-600"
                  : "text-gray-600 dark:text-gray-400 pink:text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 pink:hover:text-gray-900"
              )}
            >
              <div className="relative">
                {item.label === "Profile" ? (
                  <ProfilePicture
                    userId={currentUser?.id}
                    size="sm"
                    className="h-6 w-6"
                  />
                ) : (
                  <item.icon className={cn(
                    "h-6 w-6",
                    item.isActive
                      ? "text-blue-600 dark:text-blue-400 pink:text-pink-600"
                      : "text-gray-600 dark:text-gray-400 pink:text-gray-600"
                  )} />
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
} 