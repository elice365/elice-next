import { Translated } from "@/components/i18n/Translated";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
export const Header = () => {
  const Theme = dynamic(() => import('@/components/features/theme/ThemeSwitcher'));
  const Locale = dynamic(() => import('@/components/features/locale/LocaleSwitcher'));
  const Notification = dynamic(() => import('@/components/features/notification/Button'));
  const Profile = dynamic(() => import('@/components/features/profile/Button'));
  return (
    <header className="fixed top-0 left-0 right-0 bg-header backdrop-blur-xl border-b border-[var(--border-color)]  z-50 shadow-sm">
      <div className="mx-auto px-1 sm:px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              name="button"
              className="w-10 h-10 border border-[var(--border-color)]  bg-background shadow-2xs rounded-lg text-[var(--text-color)] hover:bg-[var(--hover)] hover:bg-primary-50 transition-colors duration-200 min-w-touch min-h-touch flex items-center justify-center"
              aria-label="메뉴 열기"
              event="panel"
            >
              <Icon name="Menu" size={18} className="text-sm rounded-sm m-auto" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white  flex items-center justify-center   border border-[var(--border-color)]  rounded-lg">
                <div className="w-8 h-8 overflow-hidden ">
                  <Image
                    src="https://cdn.elice.pro/images/logo.jpg"
                    alt="Logo"
                    width={64}
                    height={64}
                    className="w-full h-full rounded-full"
                  />
                </div>
              </div>
              <div className="overflow-hidden w-20">
                <h1 className="text-xl font-display font-bold text-[var(--text-color)]">
                  {Translated("metaData", "title")}
                </h1>
                <p className="text-xs text-neutral-400 -mt-1 h-4">
                  Alice Team
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 mr-2">
            <div className="relative">
              <Theme />
            </div>
            <div className="relative">
              <Locale />
            </div>
            <div className="relative">
              <Notification />
            </div>
            <div className="relative">
              <Profile />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
