'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  DollarSign,
  Upload,
  CheckSquare,
  LogOut,
  Menu,
  ChevronLeft,
  Fuel,
  Users,
  ClipboardList,
  ClipboardCheck,
  Coins,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

type AppLayoutProps = {
  children: React.ReactNode;
  role: string;
  username: string;
};

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, resource: 'dashboard' },
  { path: '/department', label: 'Departments', icon: Store, resource: 'department' },
  { path: '/product', label: 'Products', icon: ShoppingCart, resource: 'product' },
  { path: '/transaction', label: 'Transactions', icon: DollarSign, resource: 'transaction' },
  { path: '/upload', label: 'Upload Files', icon: Upload, resource: 'upload' },
  { path: '/shift-report', label: 'Shift Reports', icon: ClipboardList, resource: 'shift_report' },
  { path: '/cash-counting', label: 'Cash Counting', icon: Coins, resource: 'cash_counting' },
  { path: '/daily-tasks', label: 'Daily Tasks', icon: ClipboardCheck, resource: 'daily_tasks' },
  { path: '/todo', label: 'Todos', icon: CheckSquare, resource: 'todo' },
  { path: '/users', label: 'Users', icon: Users, resource: 'users' },
];

export function AppLayout({ children, role, username }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState(allNavItems);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { permissions, isLoading } = useUserRole();

  useEffect(() => {
    if (!isLoading && permissions.length > 0) {
      const filtered = allNavItems.filter(item => {
        const perm = permissions.find(p => p.resource === item.resource);
        return perm?.can_view ?? false;
      });
      setNavItems(filtered);
    }
  }, [permissions, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleNav = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-gray-900 text-white transition-all duration-300 flex flex-col
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-gray-800 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold whitespace-nowrap">Quick Gas</span>
            )}
          </div>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-gray-800">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
              role === 'admin' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
            }`}>
              {role}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block border-t border-gray-800 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-800 p-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {!collapsed && (
              <span className="hidden sm:block text-sm text-gray-600">{username}</span>
            )}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
