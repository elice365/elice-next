import { APIResult } from "@/types/api";
import { NextRequest } from "next/server";
import { setMessage } from "../response";
import jwt from 'jsonwebtoken';
import { findUserById } from "@/lib/db/user"; // 변경: prisma 대신 findUserById 임포트
import { MeJwtPayload } from "@/types/auth";


export const me = async (request: NextRequest): Promise<APIResult> => {
  try {
    if (request.method !== 'GET') {
      return await setMessage('InvalidType',  null, 405);
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return await setMessage('TokenDenied',  null, 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return await setMessage('NetworkError', null, 500);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtSecret);

    // Type guard to ensure decoded token has required properties
    if (typeof decoded === 'string' || !decoded.userId || !decoded.email || !decoded.roles) {
      return await setMessage('TokenDenied', null, 401);
    }

    // At this point, decoded is guaranteed to be a valid MeJwtPayload
    const validatedPayload = decoded as MeJwtPayload;

    const user = await findUserById(validatedPayload.userId); // 변경: findUserById 사용

    if (!user) {
      return await setMessage('NotFound',  null, 404);
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      roles: user.userRoles.map((ur: { role: { id: string } }) => ur.role.id)
    };

    return {
      success: true,
      data: { user: userData }
    };
  } catch (error) {
    // Log authentication error for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.error('Me error:', error);
    }
    return await setMessage('Unauthorized',  null, 401);
  }
};
