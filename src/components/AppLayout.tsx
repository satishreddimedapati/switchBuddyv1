'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { useAuth } from '@/lib/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

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
             <UserAvatar />
        </header>
    );
}

function UserAvatar() {
    const { user } = useAuth();
    const fallback = user?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <Avatar>
            <AvatarImage src={`https://placehold.co/40x40.png?text=${fallback}`} alt="User" />
            <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
    );
}

function AuthArea({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const showLayout = !loading && user && !['/login', '/signup'].includes(pathname);
    
    if (!showLayout) return <>{children}</>;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col">
                    <AppHeader />
                    <SidebarInset className="p-4 sm:p-6">{children}</SidebarInset>
                </div>
            </div>
        </SidebarProvider>
    );
}

function AppSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Logged Out", description: "You have been logged out successfully." });
            router.push('/login');
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to log out.", variant: 'destructive' });
        }
    };
    
    return (
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
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </div>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:size-10">
              <UserAvatar />
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-sidebar-foreground truncate">{user?.email}</span>
                <span className="text-xs text-sidebar-foreground/70">User</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
    );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
    }

    if (isAuthPage) {
        return <>{children}</>;
    }
    
    if (!user) {
        // This case is largely handled by the AuthProvider redirect, but serves as a fallback.
        return null;
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col">
                    <AppHeader />
                    <SidebarInset className="p-4 sm:p-6">{children}</SidebarInset>
                </div>
            </div>
        </SidebarProvider>
  );
}
