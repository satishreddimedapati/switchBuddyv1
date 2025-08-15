'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Columns3,
  FileText,
  MessageSquareQuote,
  LogOut,
  PanelLeft,
  CalendarCheck,
} from 'lucide-react';
import { Logo } from './Logo';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/tracker', icon: Columns3, label: 'Job Tracker' },
  { href: '/daily-tracker', icon: CalendarCheck, label: 'Daily Tracker' },
  { href: '/resume-tailor', icon: FileText, label: 'Resume Tailor' },
  { href: '/interview-prep', icon: MessageSquareQuote, label: 'Interview Prep' },
];

function AppHeader() {
    const { isMobile } = useSidebar();
    if (!isMobile) return null;

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SidebarTrigger>
            <div className="w-full flex-1">
              {/* Optional: Add search or other header items here */}
            </div>
            <Avatar>
              <AvatarImage src="https://placehold.co/40x40.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
        </header>
    );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="p-2">
                <Logo />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      asChild={false}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <div className="w-full">
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </div>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:size-10">
              <Avatar className="group-data-[collapsible=icon]:size-7">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-sidebar-foreground">Guest</span>
                <span className="text-xs text-sidebar-foreground/70">guest@switchbuddy.com</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
            <AppHeader />
            <SidebarInset className="p-4 sm:p-6">{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
