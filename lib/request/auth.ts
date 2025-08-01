import { NextRequest } from "next/server";
import { requestInfo } from "@/lib/server/info";
import { limitAPI } from "@/lib/server/limit";
import { AuthInfo, AuthOptions } from "@/types/api";
import { tokenServer } from "@/lib/services/token/server";

// 이제 이 함수는 성공 시 context를, 실패 시 에러를 던집니다.
export const auth = async (
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthInfo> => {

  const { auth = false, roles, limit = true } = options;

  const clientInfo = requestInfo(request);

  const AuthResponse: AuthInfo = {
    access:true , deviceInfo: clientInfo,
  };

  if (limit) {
    const rateLimitResult = await limitAPI(request, request.url, 30);
    if (!rateLimitResult.access) {
      return { access: false, message: "APILimit", status: 429, deviceInfo: clientInfo };
    }
  }

  if (!auth) {
    return AuthResponse;
  }

  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  const fingerprint = request.cookies.get("fp")?.value;
  const token = request.cookies.get("token")?.value;
  

  if(!fingerprint && !token){
    return { access:false , message:"TokenVerification" ,status:403 , deviceInfo: clientInfo};
  }



  //Access Token denied
  if (!accessToken) {
    return { access:false , message:"TokenDenied" ,status:403 , deviceInfo: clientInfo};
  }

  const payload = tokenServer.verify(accessToken, 'access'); 
  const requestToken = tokenServer.verifyRefreshToken(token as string); 

  // Access Token 검증 실패 시 처리
  if ('type' in payload && payload.type === 'denied') {
    return { access: false, message: payload.message, status: payload.status, deviceInfo: clientInfo };
  }

  // Refresh Token 검증 실패 시 처리
  if (!requestToken) {
    return { access: false, message: "TokenExpired", status: 401, deviceInfo: clientInfo };
  }

  // Fingerprint 검증
  if (fingerprint !== payload.fingerprint) {
    return { access: false, message: "TokenVerification", status: 403, deviceInfo: clientInfo };
  }

  // Access Token과 Refresh Token 간의 일치성 검증
  if (payload.userId !== requestToken.userId || 
      payload.sessionId !== requestToken.sessionId ||
      payload.fingerprint !== requestToken.fingerprint) {
    return { access: false, message: "TokenMismatch", status: 403, deviceInfo: clientInfo };
  }

  if (roles?.length) {
    const userRoles = payload.roles;
    const hasPermission = roles.some(role => userRoles?.includes(role));
    if (!hasPermission) {
      return { access: false, message: 'Unauthorized', status: 401, deviceInfo: clientInfo };
    }
  }

  return {
    ...AuthResponse,
    userId: payload.userId,
    email: payload.email,
    roles: payload.roles || [],
  };
};