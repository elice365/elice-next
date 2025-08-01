import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: '글을 찾을 수 없습니다',
  description: '요청하신 블로그 글을 찾을 수 없습니다.',
  robots: 'noindex, nofollow',
};

export default async function BlogNotFound() {
  const blogT = await getTranslations("router");
  
  return (
    <div className="min-h-screen bg-[var(--color-panel)] flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* 404 Icon */}
        <div className="mx-auto w-24 h-24 bg-[var(--selecter)] rounded-full flex items-center justify-center mb-8 animate-scale-in">
          <Icon name="FileText" size={48} className="text-[var(--text-color)] opacity-60" />
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-[var(--title)] mb-4">
          글을 찾을 수 없습니다
        </h1>
        
        <p className="text-[var(--text-color)] mb-8 leading-relaxed">
          요청하신 블로그 글이 존재하지 않거나 삭제되었을 수 있습니다.
          <br />
          다른 흥미로운 글들을 확인해보세요.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/blog"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--hover-primary)] to-[var(--hover-primary)]/80 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 hover-shimmer overflow-hidden"
          >
            <Icon name="ArrowLeft" size={18} />
            <span>블로그 목록으로 돌아가기</span>
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border-color)] text-[var(--text-color)] bg-[var(--background)] rounded-lg font-medium hover:bg-[var(--hover)] transition-all duration-300 hover-shimmer overflow-hidden"
          >
            <Icon name="Home" size={18} />
            <span>홈으로 이동</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-color)] opacity-60 mb-4">
            다음 페이지들도 확인해보세요:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/blog?sortBy=popular" 
              className="text-[var(--hover-primary)] hover:text-[var(--hover-info)] transition-colors duration-300 hover-shimmer overflow-hidden px-2 py-1 rounded"
            >
              인기 글
            </Link>
            <Link 
              href="/blog?sortBy=latest" 
              className="text-[var(--hover-primary)] hover:text-[var(--hover-info)] transition-colors duration-300 hover-shimmer overflow-hidden px-2 py-1 rounded"
            >
              최신 글
            </Link>
            <Link 
              href="/product" 
              className="text-[var(--hover-primary)] hover:text-[var(--hover-info)] transition-colors duration-300 hover-shimmer overflow-hidden px-2 py-1 rounded"
            >
              제품 소개
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}