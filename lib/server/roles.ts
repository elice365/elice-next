import { NextRequest } from "next/server";
import { tokenServer } from "@/lib/services/token/server";

export const roles = (request: NextRequest): string[] => {
  const refreshToken = request.cookies.get('token')?.value;
  
  if (!refreshToken) {
    return ['guest'];
  }

  try {
    const refreshTokenData = tokenServer.verifyRefreshToken(refreshToken);
    if (refreshTokenData?.roles) {
      return Array.isArray(refreshTokenData.roles) ? refreshTokenData.roles : ['guest'];
    }
  } catch {
    // refresh token 검증 실패
  }

  return ['guest'];
};