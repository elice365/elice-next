'use client';

import { useEffect, useState, memo } from 'react';
import Navigator from '@/components/layout/Navigator';
import { api } from '@/lib/fetch';
import { APIResult } from '@/types/api';
import { PanelType } from '@/types/ui/panel';
import { useTranslations } from 'next-intl';

export const Panel = memo(function Panel({ type = 'user' }: Readonly<PanelType>) {
  const t = useTranslations("router");
  const [router, setRouter] = useState<Array<{name: string; path: string; icon?: string}>>([]);

  useEffect(() => {
    const fetchRouterData = async () => {
      try {
        // API에서 라우터 데이터 가져오기
        const { data } = await api.get<APIResult>(`/api/router/${type}`);
        
        if (data?.success && Array.isArray(data?.data)) {
          // API 데이터를 변환 (아이콘은 문자열로 전달)
          const apiRouter = data.data.map((item) => ({
            name: t(item.name),
            path: item.path,
            icon: item.icon || undefined
          }));
          setRouter(apiRouter);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Panel API 호출 오류:', errorMessage);
        setRouter([]);
      }
    };

    fetchRouterData();
  }, [type, t]);

  // 로딩 상태 관계없이 Navigator 렌더링 (빈 배열로 시작)
  return <Navigator router={router} />;
});



