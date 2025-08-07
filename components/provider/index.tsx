import React, { ReactNode } from "react";
import { Panel } from "@/components/layout/Panel";
import { Redux } from "@/components/provider/Redux";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchModal } from "@/components/ui/modal/common/Search";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Auth } from "./Auth";
import { UserInfo } from "@/lib/server/auth";

interface AppProps {
  readonly children: ReactNode;
  readonly type: "admin" | "user";
}

export async function App({ children, type }: AppProps) {
  let AuthData = null;
  
  try {
    AuthData = await UserInfo();
  } catch (error) {
    console.error('[APP] Failed to get user info:', error);
    // 세션 만료 시 AuthData는 null로 유지하여 로그인 페이지로 리다이렉트
  }

  return (
    <Redux>
      <Analytics />
      <SpeedInsights />
      <Auth AuthData={AuthData}>
        <div className="bg-background flex flex-col">
          <div className="h-[64px]">
            <Header />
          </div>
          <div className="flex flex-1">
            <div className="max-w-[250px]">
              <Panel type={type} />
            </div>
            <main className="flex-1 flex items-center justify-center min-h-[90vh]">
              {children}
            </main>
          </div>
          {type === "user" && <Footer />}
        </div>
        <SearchModal />
      </Auth>
    </Redux>
  );
};