import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaData");

  return {
    title: `${t("title")} - Admin`,
    description: "Admin Dashboard",
  };
}

export default async function AdminPage() {

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-4 sm:py-6 lg:px-8 lg:py-8">
        {/* Premium Header Section with Glass Morphism */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="relative overflow-hidden admin-header rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10 overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 rotate-12 transform scale-150 animate-pulse"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-emerald-500/20 to-blue-500/20 -rotate-12 transform scale-150 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                    <div className="relative group">
                      <div className="relative p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-[var(--admin-primary)]/10 via-[var(--admin-accent)]/10 to-[var(--admin-primary)]/20 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-[var(--admin-primary)]/20">
                        <Icon name="LayoutDashboard" size={24} className="text-[var(--admin-primary)] sm:w-8 sm:h-8 lg:w-12 lg:h-12" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-[var(--color-text-header)] tracking-tight bg-gradient-to-r from-[var(--color-text-header)] to-[var(--admin-primary)] bg-clip-text">
                        Admin Dashboard
                      </h1>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 lg:mt-4">
                        <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-gradient-to-r from-[var(--admin-primary)] via-[var(--admin-accent)] to-[var(--admin-secondary)] rounded-full admin-loading-pulse"></div>
                        <div className="h-1.5 sm:h-2 w-6 sm:w-8 bg-[var(--admin-primary)]/30 rounded-full admin-loading-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="h-1.5 sm:h-2 w-3 sm:w-4 bg-[var(--admin-accent)]/30 rounded-full admin-loading-pulse" style={{ animationDelay: '1s' }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[var(--text-color)] opacity-80 text-sm sm:text-base lg:text-xl leading-relaxed max-w-3xl">
                    시스템 관리 및 모니터링을 위한 통합 관리자 대시보드입니다.<span className="hidden sm:block mt-2 text-xs sm:text-sm lg:text-lg opacity-70">효율적인 관리와 데이터 분석을 통해 더 나은 서비스를 제공하세요.</span>
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Management Cards Grid with 3D Effect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          {/* User Management Card */}
          <div className="group relative">
            <div className="admin-card p-4 sm:p-6 lg:p-8 hover:admin-card-hover group-hover:scale-105">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="relative">
                  <div className="relative p-2.5 sm:p-3 lg:p-4 bg-gradient-to-br from-[var(--admin-primary)]/10 to-[var(--admin-primary)]/20 rounded-lg sm:rounded-xl lg:rounded-2xl border border-[var(--admin-primary)]/20 group-hover:bg-[var(--admin-primary)]/20 transition-all duration-300">
                    <Icon name="Users" size={20} className="text-[var(--admin-primary)] group-hover:scale-110 transition-transform duration-300 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                  </div>
                </div>
                <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-[var(--text-panel)] group-hover:text-[var(--admin-primary)] transition-colors duration-300">사용자 관리</h2>
              </div>
              <p className="text-[var(--text-color)] opacity-80 text-xs sm:text-sm lg:text-lg leading-relaxed mb-3 sm:mb-4 lg:mb-6 line-clamp-2 sm:line-clamp-none">
                전체 사용자 계정을 관리하고 모니터링합니다. 사용자 권한, 활동 상태, 보안 설정을 통합 관리할 수 있습니다.
              </p>
              <div className="flex items-center gap-2 sm:gap-3 text-[var(--admin-primary)] font-medium group-hover:gap-3 sm:group-hover:gap-4 transition-all duration-300 text-sm sm:text-base">
                <span>관리하기</span>
                <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform duration-300 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Role Management Card */}
          <div className="group relative">
            <div className="admin-card p-4 sm:p-6 lg:p-8 hover:admin-card-hover group-hover:scale-105">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="relative">
                  <div className="relative p-2.5 sm:p-3 lg:p-4 bg-gradient-to-br from-[var(--admin-success)]/10 to-[var(--admin-success)]/20 rounded-lg sm:rounded-xl lg:rounded-2xl border border-[var(--admin-success)]/20 group-hover:bg-[var(--admin-success)]/20 transition-all duration-300">
                    <Icon name="Shield" size={20} className="text-[var(--admin-success)] group-hover:scale-110 transition-transform duration-300 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                  </div>
                </div>
                <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-[var(--text-panel)] group-hover:text-[var(--admin-success)] transition-colors duration-300">권한 관리</h2>
              </div>
              <p className="text-[var(--text-color)] opacity-80 text-xs sm:text-sm lg:text-lg leading-relaxed mb-3 sm:mb-4 lg:mb-6 line-clamp-2 sm:line-clamp-none">
                사용자 역할과 권한을 세밀하게 설정합니다. 보안 정책에 따른 접근 제어와 권한 분리를 효율적으로 관리할 수 있습니다.
              </p>
              <div className="flex items-center gap-2 sm:gap-3 text-[var(--admin-success)] font-medium group-hover:gap-3 sm:group-hover:gap-4 transition-all duration-300 text-sm sm:text-base">
                <span>관리하기</span>
                <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform duration-300 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* System Settings Card */}
          <div className="group relative">
            <div className="admin-card p-4 sm:p-6 lg:p-8 hover:admin-card-hover group-hover:scale-105">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="relative">
                  <div className="relative p-2.5 sm:p-3 lg:p-4 bg-gradient-to-br from-[var(--admin-accent)]/10 to-[var(--admin-accent)]/20 rounded-lg sm:rounded-xl lg:rounded-2xl border border-[var(--admin-accent)]/20 group-hover:bg-[var(--admin-accent)]/20 transition-all duration-300">
                    <Icon name="Settings" size={20} className="text-[var(--admin-accent)] group-hover:scale-110 transition-transform duration-300 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                  </div>
                </div>
                <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-[var(--text-panel)] group-hover:text-[var(--admin-accent)] transition-colors duration-300">시스템 설정</h2>
              </div>
              <p className="text-[var(--text-color)] opacity-80 text-xs sm:text-sm lg:text-lg leading-relaxed mb-3 sm:mb-4 lg:mb-6 line-clamp-2 sm:line-clamp-none">
                시스템 전반의 설정과 구성을 관리합니다. 성능 최적화, 보안 설정, 백업 정책 등을 통합적으로 관리할 수 있습니다.
              </p>
              <div className="flex items-center gap-2 sm:gap-3 text-[var(--admin-accent)] font-medium group-hover:gap-3 sm:group-hover:gap-4 transition-all duration-300 text-sm sm:text-base">
                <span>관리하기</span>
                <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform duration-300 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}