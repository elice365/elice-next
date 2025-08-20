// FLO 메인 페이지 - 서버 컴포넌트에서 데이터 페칭
import { Metadata } from 'next';
import FloWithDiagnostic from '@/components/pages/FloWithDiagnostic';
import type { FloContentType } from '@/types/flo';

export const metadata: Metadata = {
  title: 'FLO - 모든 음악이 흐르는 곳',
  description: '최신 음악, 큐레이션, 장르별 차트를 확인해보세요',
};

// 서버에서 데이터 가져오기 (24시간 캐싱)
async function getFloData(type: FloContentType, filter?: string) {
  try {
    // 현재 호스트를 기반으로 baseUrl 설정 (Next.js headers 사용)
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;
    
    const url = filter 
      ? `${baseUrl}/api/flo/${type}?filter=${filter}`
      : `${baseUrl}/api/flo/${type}`;
      
    console.log(`FLO API fetching: ${url}`);
      
    const response = await fetch(url, {
      next: { 
        revalidate: 86400, // 24시간 캐싱
        tags: [`flo-${type}${filter ? `-${filter}` : ''}`]
      },
      cache: 'force-cache',
      // 타임아웃 설정으로 빌드 시간 단축
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

export default async function FloPage() {
  // Promise.all로 모든 데이터를 동시에 페칭
  const [
    newMusicAllData,    // 전체 최신 음악 (앨범)
    newMusicKpopData,   // 한국 최신 음악 (앨범)
    newMusicPopData,    // 해외 최신 음악 (앨범)
    contentsData, 
    vcoloringData,      // V컬러링
    genresData, 
    editorsPickData, 
    healingData,
    chartsData
  ] = await Promise.all([
    getFloData('new-music', 'ALL'),    // 전체 최신 음악
    getFloData('new-music', 'KPOP'),   // 한국 최신 음악
    getFloData('new-music', 'POP'),    // 해외 최신 음악
    getFloData('contents'),
    getFloData('vcoloring'),           // V컬러링 추가
    getFloData('genres'),
    getFloData('editors-pick'),
    getFloData('healing'),
    getFloData('charts')
  ]);

  // 모든 탭의 데이터를 객체로 구성
  const allTabsData: Record<string, any> = {
    // 최신 음악 - 기본값 ALL
    'new-music': newMusicAllData,
    'new-music-ALL': newMusicAllData,
    'new-music-KPOP': newMusicKpopData,
    'new-music-POP': newMusicPopData,
    // 기타 콘텐츠
    'contents': contentsData,
    'vcoloring': vcoloringData,
    'genres': genresData,
    'editors-pick': editorsPickData,
    'healing': healingData,
    'charts': chartsData
  };

  // 데이터 로드 확인 (모든 환경)
  console.log('FLO Server-side data loaded:', {
    'new-music-ALL': newMusicAllData?.length || 0,
    'new-music-KPOP': newMusicKpopData?.length || 0,
    'new-music-POP': newMusicPopData?.length || 0,
    'contents': contentsData?.length || 0,
    'vcoloring': vcoloringData?.length || 0,
    'genres': genresData?.length || 0,
    'editors-pick': editorsPickData?.length || 0,
    'healing': healingData?.length || 0,
    'charts': chartsData?.length || 0
  });

  return (
    <FloWithDiagnostic 
      initialType="new-music"
      serverData={allTabsData}
    />
  );
}