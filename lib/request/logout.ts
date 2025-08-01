import { NextRequest } from "next/server";
import { deactivateSession } from "@/lib/db/session"; // 변경: prisma 대신 deactivateSession 임포트
import { setMessage } from "../response";
import { APIResult } from "@/types/api";

// 로그아웃
export const logout = async (request: NextRequest): Promise<APIResult> => {
  try {
    // 쿠키에서 refresh token 가져오기
    if (request.method !== 'POST') {
      return await setMessage('InvalidType',  null, 405);
    }
    const refreshToken = request.cookies.get('token')?.value;
    
    if (refreshToken) {
      // 해당 세션을 비활성화
      try {
        await deactivateSession(refreshToken); // 변경: deactivateSession 사용
      } catch (dbError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to deactivate session:', dbError);
        }
      }
    }

    return await setMessage('Logout',null, 200);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Logout error:', error);
    }
    return setMessage('UnknownError',  null, 500);
  }
};