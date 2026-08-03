import React, { useState } from 'react';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const { user, role, isLoading: loading, isAdmin, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      <AdminSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        role={role} 
      />
      
      <div className="flex-1 overflow-hidden flex flex-col w-full h-full relative">
        <AdminHeader 
          title={title}
          subtitle={subtitle}
          actions={actions}
          user={user}
          role={role}
          onSignOut={signOut}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-0">
          <div className="max-w-7xl mx-auto w-full h-full pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
