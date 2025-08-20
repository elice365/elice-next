// FLO 세션 갱신 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { autoLoginClient } from '@/lib/flo/login';
import { deleteFloSession, getFloSession } from '@/lib/db/flo';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 FLO 세션 갱신 요청 시작');
    
    // 기존 세션 삭제 (만료된 세션 정리)
    await deleteFloSession();
    console.log('🗑️ 기존 FLO 세션 삭제 완료');
    
    // 새로운 로그인 시도
    const loginResult = await autoLoginClient.autoLogin();
    
    if (!loginResult.success) {
      console.error('❌ FLO 자동 로그인 실패:', loginResult.error);
      return NextResponse.json({
        success: false,
        message: loginResult.error || 'FLO 로그인에 실패했습니다'
      }, { status: 401 });
    }
    
    // 새 세션 확인
    const newSession = await getFloSession();
    if (!newSession) {
      console.error('❌ 로그인 후 세션을 찾을 수 없습니다');
      return NextResponse.json({
        success: false,
        message: '로그인은 성공했지만 세션을 생성할 수 없습니다'
      }, { status: 500 });
    }
    
    console.log('✅ FLO 세션 갱신 성공');
    
    return NextResponse.json({
      success: true,
      message: 'FLO 세션이 성공적으로 갱신되었습니다',
      data: {
        sessionId: newSession.id,
        expiresAt: newSession.expiresAt,
        appVersion: newSession.appVersion
      }
    });
    
  } catch (error) {
    console.error('💥 FLO 세션 갱신 중 오류:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'FLO 세션 갱신 실패'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 현재 세션 상태 확인
    const session = await getFloSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'FLO 세션이 없습니다',
        data: { hasSession: false }
      });
    }
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const isExpired = now >= expiresAt;
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    return NextResponse.json({
      success: true,
      message: 'FLO 세션 상태',
      data: {
        hasSession: true,
        isExpired,
        expiresAt: session.expiresAt,
        timeLeft: Math.max(0, timeLeft),
        appVersion: session.appVersion
      }
    });
    
  } catch (error) {
    console.error('💥 FLO 세션 상태 확인 중 오류:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'FLO 세션 상태 확인 실패'
    }, { status: 500 });
  }
}