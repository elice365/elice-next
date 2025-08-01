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
    <div className="min-h-screen ">
      <div className="!max-w-6xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Premium Header Section with Glass Morphism */}
        <div className="mb-8 lg:mb-12">
          <div className="relative overflow-hidden bg-[var(--color-header)]/80 backdrop-blur-xl border border-[var(--border-color)] /30 rounded-2xl p-6 lg:p-8 shadow-sm">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10 overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 rotate-12 transform scale-150 animate-pulse"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-emerald-500/20 to-blue-500/20 -rotate-12 transform scale-150 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="relative p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-600/20 rounded-3xl border border-blue-500/20">
                        <Icon name="LayoutDashboard" size={48} className="text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-5xl lg:text-6xl font-bold text-[var(--color-text-header)] tracking-tight bg-gradient-to-r from-[var(--color-text-header)] to-blue-600 bg-clip-text">
                        Admin Dashboard
                      </h1>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="h-2 w-16 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full animate-pulse"></div>
                        <div className="h-2 w-8 bg-blue-300/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="h-2 w-4 bg-purple-300/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[var(--text-color)] opacity-80 text-xl lg:text-2xl leading-relaxed max-w-3xl">
                    시스템 관리 및 모니터링을 위한 통합 관리자 대시보드입니다.<span className="block mt-2 text-lg opacity-70">효율적인 관리와 데이터 분석을 통해 더 나은 서비스를 제공하세요.</span>
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Management Cards Grid with 3D Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-16">
          {/* User Management Card */}
          <div className="group relative">
            <div className="relative bg-[var(--color-panel)]/80 backdrop-blur-xl border border-[var(--border-color)] /30 p-8 lg:p-10 rounded-3xl shadow-xl hover:shadow-sm transition-all duration-500 group-hover:scale-105">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="relative p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-2xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-300">
                    <Icon name="Users" size={32} className="text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-panel)] group-hover:text-blue-600 transition-colors duration-300">사용자 관리</h2>
              </div>
              <p className="text-[var(--text-color)] opacity-80 text-lg leading-relaxed mb-6">
                전체 사용자 계정을 관리하고 모니터링합니다. 사용자 권한, 활동 상태, 보안 설정을 통합 관리할 수 있습니다.
              </p>
              <div className="flex items-center gap-3 text-blue-600 font-medium group-hover:gap-4 transition-all duration-300">
                <span>관리하기</span>
                <Icon name="ArrowRight" size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Role Management Card */}
          <div className="group relative">
            <div className="relative bg-[var(--color-panel)]/80 backdrop-blur-xl border border-[var(--border-color)] /30 p-8 lg:p-10 rounded-3xl shadow-xl hover:shadow-sm transition-all duration-500 group-hover:scale-105">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <Icon name="Shield" size={32} className="text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-panel)] group-hover:text-emerald-600 transition-colors duration-300">권한 관리</h2>
              </div>
              <p className="text-[var(--text-color)] opacity-80 text-lg leading-relaxed mb-6">
                사용자 역할과 권한을 세밀하게 설정합니다. 보안 정책에 따른 접근 제어와 권한 분리를 효율적으로 관리할 수 있습니다.
              </p>
              <div className="flex items-center gap-3 text-emerald-600 font-medium group-hover:gap-4 transition-all duration-300">
                <span>관리하기</span>
                <Icon name="ArrowRight" size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* System Settings Card */}
          <div className="group relative">
            <div className="relative bg-[var(--color-panel)]/80 backdrop-blur-xl border border-[var(--border-color)] /30 p-8 lg:p-10 rounded-3xl shadow-xl hover:shadow-sm transition-all duration-500 group-hover:scale-105">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="relative p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-2xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-all duration-300">
                    <Icon name="Settings" size={32} className="text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-panel)] group-hover:text-purple-600 transition-colors duration-300">시스템 설정</h2>
              </div>
              <p className="text-[var(--text-color)] opacity-80 text-lg leading-relaxed mb-6">
                시스템 전반의 설정과 구성을 관리합니다. 성능 최적화, 보안 설정, 백업 정책 등을 통합적으로 관리할 수 있습니다.
              </p>
              <div className="flex items-center gap-3 text-purple-600 font-medium group-hover:gap-4 transition-all duration-300">
                <span>관리하기</span>
                <Icon name="ArrowRight" size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}