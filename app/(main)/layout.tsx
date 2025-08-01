import { App } from "@/components/provider";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <App type="user">
      {children}
    </App>
  );
}
