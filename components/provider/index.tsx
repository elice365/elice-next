import React from "react";
import { Panel } from "@/components/layout/Panel";
import { Redux } from "@/components/provider/Redux";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchModal } from "@/components/ui/modal/common/Search";
import { NavigationProgress } from "@/components/features/navigation/NavigationProgress";
import ConditionalMusicPlayer from "@/components/ui/ConditionalMusicPlayer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Auth } from "./Auth";
import { UserInfo } from "@/lib/server/auth";
import type { AppProps } from '@/types/common/provider';
import { logger } from "@/utils/logger";


export async function App({ children, type }: Readonly<AppProps>) {
  let AuthData = null;

  try {
    AuthData = await UserInfo();
  } catch (error) {

   logger.error("Failed to fetch user info", "AUTH", { error }); // Ensure you have a logger set up
  }

  return (
    <Redux>
      <Analytics />
      <SpeedInsights />
      <Auth AuthData={AuthData}>
        <NavigationProgress />
        <div className="bg-background flex flex-col min-h-screen">
          <div className="h-[64px]">
            <Header />
          </div>
          <div className="flex flex-1">
            <div className="max-w-[250px]">
              <Panel type={type} />
            </div>
            <main className="flex-1">
              {children}
            </main>
          </div>
          {type === "user" && <Footer />}
        </div>
        <SearchModal />
        <ConditionalMusicPlayer />
      </Auth>
    </Redux>
  );
};