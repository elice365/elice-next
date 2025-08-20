import { App } from "@/components/provider";
import { AdminProvider } from "@/components/provider/Admin";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import "@/styles/admin/layout.css";

export const dynamic = 'force-dynamic';

// Helper function to get icon color class
function getIconColorClass(color: string): string {
  switch (color) {
    case 'primary':
      return 'text-[var(--admin-primary)]';
    case 'accent':
      return 'text-[var(--admin-accent)]';
    case 'success':
      return 'text-[var(--admin-success)]';
    case 'warning':
      return 'text-[var(--admin-warning)]';
    case 'danger':
      return 'text-[var(--admin-danger)]';
    case 'info':
      return 'text-[var(--admin-info)]';
    case 'secondary':
    default:
      return 'text-[var(--admin-secondary)]';
  }
}

// Admin navigation items with theme-aware colors
const adminNavItems = [
  { 
    href: "/admin", 
    label: "대시보드", 
    icon: "LayoutDashboard",
    color: "primary"
  },
  { 
    href: "/admin/user", 
    label: "사용자 관리", 
    icon: "Users",
    color: "primary"
  },
  { 
    href: "/admin/blog", 
    label: "블로그 관리", 
    icon: "BookOpen",
    color: "accent"
  },
  { 
    href: "/admin/role", 
    label: "권한 관리", 
    icon: "Shield",
    color: "success"
  },
  { 
    href: "/admin/category", 
    label: "카테고리", 
    icon: "FolderTree",
    color: "info"
  },
  { 
    href: "/admin/notification", 
    label: "알림 관리", 
    icon: "Bell",
    color: "warning"
  },
  { 
    href: "/admin/session", 
    label: "세션 관리", 
    icon: "Activity",
    color: "secondary"
  },
  { 
    href: "/admin/router", 
    label: "라우터 관리", 
    icon: "Network",
    color: "danger"
  },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <App type="admin">
      <AdminProvider>
        {/* Admin Content Container - fills entire available space */}
        <div className="admin-content-wrapper flex flex-col min-h-screen w-full">
          {/* Admin Sub Header - 기존 헤더 아래에 위치 */}
          <div className="admin-sub-header bg-[var(--background)] border-b border-[var(--admin-header-border)] flex-shrink-0 mt-0 md:mt-3 lg:mt-5">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-12 md:h-14 lg:h-16">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1 sm:p-1.5 bg-gradient-to-br from-[var(--admin-primary)]/10 to-[var(--admin-primary)]/20 rounded-md border border-[var(--admin-primary)]/20">
                    <Icon name="Settings" size={14} className="text-[var(--admin-primary)] sm:w-4 sm:h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">관리자 대시보드</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Navigation - 개선된 호버 효과 */}
          <nav className="admin-navigation bg-[var(--background)] border-b border-[var(--admin-header-border)] flex-shrink-0">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex flex-row items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="admin-nav-item group flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
                  >
                    <Icon 
                      name={item.icon as any} 
                      size={14} 
                      className={`${getIconColorClass(item.color)} transition-colors duration-200`}
                    />
                    <span className="group-hover:text-[var(--admin-primary)] transition-colors duration-200">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Main Content - fills available space */}
          <main className="admin-main-content flex-1 flex flex-col overflow-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex-grow">
              {children}
            </div>
          </main>

          {/* Admin Footer - always at bottom */}
          <footer className="admin-footer bg-[var(--background)] border-t border-[var(--admin-header-border)] flex-shrink-0 mt-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
              <div className="text-xs text-center text-[var(--text-color)]">
                <span>© 2024 Elice Admin</span>
              </div>
            </div>
          </footer>
        </div>
      </AdminProvider>
    </App>
  );
}
