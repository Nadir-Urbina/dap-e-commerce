'use client';

import { useAuthContext } from '@/components/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Menu, X } from 'lucide-react';
import { DashboardHeader } from "@/components/ui/dashboard-header";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Package, 
  Truck, 
  BarChart, 
  Calendar, 
  FileText, 
  Settings, 
  User, 
  Users,
  LogOut, 
  Layers, 
  AlertCircle,
  MapPin,
  Clock,
  Box,
  Wrench,
  LineChart,
  Factory
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading, signOut } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has admin or staff role, otherwise redirect to home
  useEffect(() => {
    if (!loading && (!user || (userData?.role !== 'admin' && userData?.role !== 'staff'))) {
      router.push('/');
    }
  }, [user, userData, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#EFCD00] animate-spin" />
        <p className="ml-2 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  // If not loading and no user, don't render content (will redirect)
  if (!loading && (!user || (userData?.role !== 'admin' && userData?.role !== 'staff'))) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Only show certain sidebar links to admins
  const isAdmin = userData?.role === 'admin';

  const SidebarContent = () => (
    <>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#EFCD00]">DUVAL ASPHALT</h2>
          </div>
          <p className="text-xs text-gray-500">Plant Management Dashboard</p>
        </div>
        <div className="px-4">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                pathname === "/dashboard" && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
              )}
            >
              <Home className="h-4 w-4" />
              <span>Overview</span>
            </Link>

            {/* Orders Management */}
            <Link
              href="/dashboard/orders"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                pathname?.startsWith("/dashboard/orders") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
              )}
            >
              <Truck className="h-4 w-4" />
              <span>Orders</span>
            </Link>

            {/* Plants */}
            <div className="pt-2">
              <p className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500">
                PLANTS
              </p>
              <Link
                href="/dashboard/plants"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                  pathname?.startsWith("/dashboard/plants") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                )}
              >
                <Factory className="h-4 w-4" />
                <span>Plants</span>
              </Link>
            </div>

            {/* Product Management */}
            <div className="pt-2">
              <p className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500">
                INVENTORY
              </p>
              <Link
                href="/dashboard/products"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                  (pathname === "/dashboard/products" || 
                    pathname?.startsWith("/dashboard/products/asphalt")) && 
                    "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                )}
              >
                <Box className="h-4 w-4" />
                <span>Asphalt Products</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/dashboard/products/equipment"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                    pathname?.startsWith("/dashboard/products/equipment") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  <span>Equipment & Parts</span>
                </Link>
              )}
            </div>

            {/* Administration - Only for admin users */}
            {isAdmin && (
              <div className="pt-2">
                <p className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500">
                  ADMINISTRATION
                </p>
                <Link
                  href="/dashboard/locations"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                    pathname?.startsWith("/dashboard/locations") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                  )}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Locations</span>
                </Link>
                
                <Link
                  href="/dashboard/hours"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                    pathname?.startsWith("/dashboard/hours") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span>Operating Hours</span>
                </Link>

                <Link
                  href="/dashboard/users"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                    pathname?.startsWith("/dashboard/users") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </Link>
              </div>
            )}

            {/* Analytics & Reports */}
            <div className="pt-2">
              <p className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500">
                ANALYTICS
              </p>
              <Link
                href="/dashboard/reports"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                  pathname?.startsWith("/dashboard/reports") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Reports</span>
              </Link>
              
              {isAdmin && (
                <Link
                  href="/dashboard/analytics"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                    pathname?.startsWith("/dashboard/analytics") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
                  )}
                >
                  <LineChart className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* System section */}
        <div className="px-4 py-2 mt-auto">
          <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500">
            SYSTEM
          </h2>
          <div className="space-y-1">
            <Link
              href="/dashboard/alerts"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                pathname?.startsWith("/dashboard/alerts") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
              )}
            >
              <AlertCircle className="h-4 w-4" />
              <span>Alerts</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                pathname?.startsWith("/dashboard/settings") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <Link
              href="/dashboard/profile"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-[#EFCD00]",
                pathname?.startsWith("/dashboard/profile") && "bg-[#EFCD00]/10 font-medium text-[#EFCD00]"
              )}
            >
              <User className="h-4 w-4" />
              <span>My Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 transition-all hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr] bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-zinc-950 lg:block">
        <div className="flex h-full w-full flex-col">
          <SidebarContent />
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#EFCD00]">DUVAL ASPHALT</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 h-[calc(100vh-8rem)] overflow-y-auto">
            <SidebarContent />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <DashboardHeader />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
} 