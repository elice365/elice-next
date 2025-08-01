import { App } from "@/components/provider";
import { AdminProvider } from "@/components/provider/Admin";

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 

  return (
    <App type="admin">
      <AdminProvider>
      {children}
      </AdminProvider>
    </App>
  );
}
