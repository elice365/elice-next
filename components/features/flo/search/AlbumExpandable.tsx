// 확장 가능한 앨범 카드 컴포넌트 (토글 + TrackTable)
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { FloSearchedAlbum } from '@/types/flo/flo';
import TrackTable from '../TrackTable';
import { useAlbumTracks } from '@/hooks/flo/useAlbumTracks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { logger } from '@/utils/logger';

interface AlbumExpandableProps {
  album: FloSearchedAlbum;
  defaultExpanded?: boolean;
  onToggle?: (albumId: number, expanded: boolean) => void;
  onAlbumClick?: (album: FloSearchedAlbum) => void;
}

const AlbumExpandable: React.FC<AlbumExpandableProps> = ({
  album,
  defaultExpanded = false,
  onToggle,
  onAlbumClick
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { fetchIfNeeded, get, loading, error } = useAlbumTracks();

  // 확장 토글 핸들러
  const handleToggle = useCallback(async () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    if (onToggle) {
      onToggle(album.id, newExpanded);
    }

    // 열릴 때 트랙 로드
    if (newExpanded && album.id) {
      await fetchIfNeeded(album.id);
    }

    logger.flo.debug('Album expanded state changed', {
      albumId: album.id,
      expanded: newExpanded,
      albumTitle: album.title
    });
  }, [expanded, album.id, album.title, fetchIfNeeded, onToggle]);

  // 앨범 클릭 핸들러
  const handleAlbumClick = useCallback(() => {
    if (onAlbumClick) {
      onAlbumClick(album);
    }
  }, [album, onAlbumClick]);

  // 컴포넌트 마운트 시 기본 확장 상태면 트랙 로드
  useEffect(() => {
    if (defaultExpanded && album.id) {
      fetchIfNeeded(album.id);
    }
  }, [defaultExpanded, album.id, fetchIfNeeded]);

  const tracks = get(album.id);
  const isLoading = loading(album.id);
  const errorMessage = error(album.id);

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* 앨범 헤더 */}
      <div 
        className="flex items-center space-x-4 cursor-pointer"
        onClick={handleToggle}
      >
        {/* 앨범 이미지 */}
        <div className="relative w-20 h-20 flex-shrink-0">
          {album.imgList && album.imgList.length > 0 ? (
            <Image
              src={album.imgList[0]?.url || '/images/default-album.jpg'}
              alt={album.title || '앨범'}
              fill
              className="rounded-md object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* 앨범 정보 */}
        <div className="flex-1">
          <h3 
            className="font-medium text-base hover:text-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleAlbumClick();
            }}
          >
            {album.title}
          </h3>
          <p className="text-sm text-gray-600">
            {album.artistList?.map(a => a.name).join(', ')}
          </p>
          {album.releaseYmd && (
            <p className="text-xs text-gray-500">
              {album.releaseYmd.substring(0, 4)}.
              {album.releaseYmd.substring(4, 6)}.
              {album.releaseYmd.substring(6, 8)}
            </p>
          )}
        </div>

        {/* 확장 아이콘 */}
        <div className="flex-shrink-0">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* 확장 영역 - 트랙 테이블 */}
      {expanded && (
        <div className="mt-4 pl-24">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="small" />
            </div>
          ) : errorMessage ? (
            <div className="text-red-500 text-sm py-4">
              {errorMessage}
            </div>
          ) : tracks.length > 0 ? (
            <TrackTable
              album={{
                id: album.id,
                title: album.title || '',
                imgList: album.imgList || []
              }}
              tracks={tracks}
            />
          ) : (
            <div className="text-gray-500 text-sm py-4">
              트랙 정보가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumExpandable;