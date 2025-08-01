import { APIResult } from "@/types/api";
import { NextRequest } from "next/server";
import { findUser } from "@/lib/db/user"; // 변경: prisma 대신 findUser 임포트
import { createSession } from "@/lib/db/session"; // 변경: prisma 대신 createSession 임포트
import { requestInfo } from "@/lib/server/info";
import { randomUUID } from "crypto";
import { tokenServer } from "@/lib/services/token/server";
import * as argon2 from 'argon2';
import { setMessage } from "../response";
import { authRegex } from "@/utils/regex/auth";
import { history } from "@/lib/db/history";
// 로그인
export const login = async (request: NextRequest): Promise<APIResult> => {
  try {

    if (request.method !== 'POST') {
      return await setMessage('InvalidType', null, 405);
    }
    const { email, password, fingerprint } = await request.json();

    const validation = await authRegex(email, password);

    if (!validation.isValid) {
      return await setMessage('InvalidField', null, 401);
    }



    // 사용자 조회
    const user = await findUser(email);

    if (!user?.auth) {
      return await setMessage('AuthError', null, 401);
    }

    // 클라이언트 정보 가져오기 (비밀번호 검증 전에 미리 가져오기)
    const clientInfo = requestInfo(request);

    if (!await argon2.verify(user.auth.passwordHash, password)) {
      // 로그인 실패 기록
      await history(email, false, clientInfo);
      return await setMessage('AuthError', null, 401);
    }

    // 이메일 인증 확인
    if (!user.auth.emailVerified) {
      return await setMessage('emailVerification', { emailVerification: true }, 401);
    }

    // 사용자 계정 상태 확인
    if (user.status === 'suspended') {
      return await setMessage('AccountSuspended', null, 403);
    }

    if (user.status === 'inactive') {
      return await setMessage('AccountInactive', null, 403);
    }

    const sessionId = randomUUID();

    // 토큰 쌍 생성
    const tokenPayload = {
      sessionId: sessionId,
      userId: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      roles: user.userRoles.map(ur => ur.role.id),
      fingerprint: fingerprint
    };

    const { accessToken, refreshToken } = tokenServer.genTokenPair(tokenPayload);

    // 세션 저장
    await createSession({ // 변경: createSession 사용
      sessionId,
      user: { connect: { id: user.id } },
      refreshToken,
      deviceInfo: JSON.stringify(clientInfo),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      loginType: 'email',
      expiresTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
    });

    // 로그인 성공 기록
    await history(email, true, clientInfo);

    // 사용자 정보 반환
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      roles: user.userRoles.map(ur => ur.role.id)
    };

    return await setMessage('loginSuccess', {
      user: userData,
      token: accessToken,
      refreshToken,
      sessionId,
      fingerprint
    },200);
  } catch (error) {
    // Log error details for server monitoring
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }
    return await setMessage('UnknownError', null, 500);
  }
};
