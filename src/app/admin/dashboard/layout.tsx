"use client";

import { useState } from "react";
import { AdminHeader } from "@/app/components/layout/AdminHeader";
import { AdminSidebarMinimal } from "@/app/components/layout/sidebars/AdminSidebarMinimal";
import { AdminContent } from "@/app/components/layout/AdminContent";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <AdminSidebarMinimal open={sidebarOpen} onClose={handleToggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <AdminHeader title="Dashboard" onToggleSidebar={handleToggleSidebar} />
        
        {/* Main Page Area */}
        <main className="flex-1 p-6">
          <AdminContent>{children}</AdminContent>
        </main>
      </div>
    </div>
  );
}
