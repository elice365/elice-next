'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// 동적 import로 MusicPlayer 로드 (FLO 페이지에서만)
const MusicPlayer = dynamic(() => import('./MusicPlayer'), {
  ssr: false
});

const ConditionalMusicPlayer: React.FC = () => {
  const pathname = usePathname();
  
  // FLO 페이지에서만 플레이어 표시
  const isFloPage = pathname?.startsWith('/flo');
  
  if (!isFloPage) {
    return null;
  }
  
  return <MusicPlayer />;
};

export default ConditionalMusicPlayer;