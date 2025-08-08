"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card } from "./Card";
import { ListItem } from "./List";
import { Tag } from "@/types/post";
import "@/styles/blog-display.css";

interface BlogPost {
  uid: string;
  title: string;
  description: string;
  url?: string;
  images?: string[];
  tags?: Tag[];
  author?: {
    name: string;
    profileImage?: string;
    description?: string;
  };
  views?: number;
  likeCount?: number;
  createdTime?: string;
  category?: {
    name: string;
    slug: string;
  };
}

interface BlogDisplayProps {
  readonly posts: readonly BlogPost[];
  readonly isLoading?: boolean;
  readonly locale?: string;
  readonly defaultView?: "card" | "list";
}

export function Display({ 
  posts, 
  isLoading = false, 
  locale = "ko",
  defaultView = "card" 
}: BlogDisplayProps) {
  const [viewType, setViewType] = useState<"card" | "list">(defaultView);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* View toggle skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        
        {/* Content skeleton */}
        {viewType === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={`card-skeleton-${viewType}-${i}`} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-64 mb-4"></div>
                <div className="px-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={`list-skeleton-${viewType}-${i}`} className="animate-pulse flex gap-6 p-6 bg-gray-100 rounded-xl">
                <div className="w-48 h-36 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5c5049]/10 rounded-full mb-6">
          <Icon name="FileText" size={40} className="text-[#5c5049]" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--title)] mb-3">게시글이 없습니다</h3>
        <p className="text-base text-[var(--text-color)] opacity-60 max-w-md mx-auto">
          새로운 게시글이 곧 업데이트될 예정입니다. 
          조금만 기다려주세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[var(--title)]">블로그</h2>
          <span className="text-base text-[var(--text-color)] opacity-60">
            총 <span className="font-bold text-[#5c5049]">{posts.length}</span>개의 글
          </span>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1 p-1 bg-[var(--hover)] rounded-lg">
          <button
            onClick={() => setViewType("card")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
              viewType === "card"
                ? "bg-[#5c5049] text-white shadow-md"
                : "text-[var(--text-color)] hover:bg-[var(--background)] hover:text-[#5c5049]"
            }`}
            aria-label="카드 보기"
          >
            <Icon name="Grid" size={18} />
            <span className="text-sm font-medium hidden sm:inline">카드</span>
          </button>
          <button
            onClick={() => setViewType("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
              viewType === "list"
                ? "bg-[#5c5049] text-white shadow-md"
                : "text-[var(--text-color)] hover:bg-[var(--background)] hover:text-[#5c5049]"
            }`}
            aria-label="리스트 보기"
          >
            <Icon name="List" size={18} />
            <span className="text-sm font-medium hidden sm:inline">리스트</span>
          </button>
        </div>
      </div>

      {/* Content Area with Animation */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}>
        {viewType === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {posts.map((post, index) => (
              <div
                key={post.uid}
                className="animate-fade-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <Card
                  post={{
                    ...post,
                    type: 'blog',
                    createdTime: post.createdTime ? new Date(post.createdTime) : new Date(),
                    updatedTime: new Date(),
                    images: post.images || [],
                    views: post.views || 0,
                    likeCount: post.likeCount || 0,
                    tags: post.tags || [],
                    url: post.url || '',
                    isLiked: false,
                    category: post.category ? {
                      uid: '',
                      code: post.category.slug,
                      name: post.category.name,
                      slug: post.category.slug,
                      path: `/${post.category.slug}`,
                      level: 1
                    } : undefined
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div
                key={post.uid}
                className="animate-slide-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <ListItem
                  post={{
                    ...post,
                    type: 'blog',
                    createdTime: post.createdTime ? new Date(post.createdTime) : new Date(),
                    updatedTime: new Date(),
                    images: post.images || [],
                    views: post.views || 0,
                    likeCount: post.likeCount || 0,
                    tags: post.tags || [],
                    url: post.url || '',
                    isLiked: false,
                    category: post.category ? {
                      uid: '',
                      code: post.category.slug,
                      name: post.category.name,
                      slug: post.category.slug,
                      path: `/${post.category.slug}`,
                      level: 1
                    } : undefined
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}