import React from "react";
import { Panel } from "@/components/layout/Panel";
import { Redux } from "@/components/provider/Redux";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchModal } from "@/components/ui/modal/common/Search";
import { NavigationProgress } from "@/components/features/navigation/NavigationProgress";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Auth } from "./Auth";
import { UserInfo } from "@/lib/server/auth";
import type { AppProps } from '@/types/common/provider';


export async function App({ children, type }: AppProps) {
  let AuthData = null;

  try {
    AuthData = await UserInfo();
  } catch (error) {
    // 세션 만료나 네트워크 오류 시 AuthData는 null로 유지
    // 로그는 UserInfo 함수 내부에서 처리됨
  }

  return (
    <Redux>
      <Analytics />
      <SpeedInsights />
      <Auth AuthData={AuthData}>
        <NavigationProgress />
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