import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Drawer } from '../ui/Drawer';

/**
 * AppShell layout component
 * - Desktop: fixed sidebar on the left, sticky topbar, content in <Outlet/>
 * - Mobile: off-canvas drawer opened by hamburger
 */
export const AppShell = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f6f5f2] text-neutral-900">
      {/* Desktop Sidebar (fixed) */}
      <div className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        maxWidth="max-w-[280px]"
      >
        <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
