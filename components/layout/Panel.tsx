import dynamic from 'next/dynamic';
import { api } from '@/lib/fetch';
import { APIResult } from '@/types/api';
import { PanelType } from '@/types/panel';
import { getTranslations } from 'next-intl/server';



export async function Panel({ type = 'user' }: PanelType) {
  try {
    const Navigator = dynamic(() => import('@/components/layout/Navigator'));
    const t = await getTranslations("router");
    let apiRouter: any[] = [];

    try {
      // API에서 라우터 데이터 가져오기
      const { data } = await api.get<APIResult>(`/api/router/${type}`);
      if (!data) {
        return <Navigator router={[]} />;
      }

      // API 데이터를 변환 (아이콘은 문자열로 전달)
      apiRouter = (data?.success && Array.isArray(data?.data)) ? data.data.map((item: any) => ({
        name: t(item.name),
        path: item.path,
        icon: item.icon || undefined
      })) : [];
    } catch (error) {
      console.error('Panel API 호출 오류:', error);
      apiRouter = [];
    }

    // API 데이터가 있으면 사용, 없으면 기본값 사용
    const router = apiRouter;

    return (
      <Navigator router={router} />
    );
  } catch (error) {
    console.error('Panel 컴포넌트 오류:', error);
    return <div>Navigation loading...</div>;
  }
};



