
'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Briefcase,
  LogOut,
  PanelLeft,
  CalendarCheck,
  Loader2,
  User,
  Settings,
  BrainCircuit,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ViewModeToggle } from './ViewModeToggle';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/daily-tracker', icon: CalendarCheck, label: 'Daily Tracker' },
  { href: '/job-switch-helper', icon: Briefcase, label: 'JobSwitch Helper' },
  { href: '/ai-learning', icon: BrainCircuit, label: 'AI Learning' },
  { href: '/profile', icon: User, label: 'Profile & Rewards' },
];

const mobileNavItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/daily-tracker', icon: CalendarCheck, label: 'Daily Tracker' },
    { href: '/job-switch-helper', icon: Briefcase, label: 'JobSwitch Helper' },
    { href: '/ai-learning', icon: BrainCircuit, label: 'AI Learning' },
    { href: '/profile', icon: User, label: 'Profile & Rewards' },
];

function AppHeader() {
    const { isMobile } = useSidebar();
    if (!isMobile) return null;

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {mobileNavItems.map(item => (
                        <DropdownMenuItem key={item.href} asChild>
                             <Link href={item.href}>
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-full flex-1">
              <ViewModeToggle />
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
                      isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
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
                 <div className="p-2">
                    <ViewModeToggle />
                 </div>
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
