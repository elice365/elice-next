import { registerEmail } from "@/constants/registerEmail";
import { sendEmail } from "@/utils/email/sendMail";
import { setMessage } from "../response";
import { NextRequest } from "next/server";
import { APIResult } from "@/types/api";
import { findUserByEmail, createUser } from "@/lib/db/user";
import { setUserRole, searchRole } from "@/lib/db/roles";
import { registerSchema, validateApiRequest } from "@/lib/validation/schemas";
import { logger } from "@/utils/logger";
import * as argon2 from 'argon2';
import { randomUUID } from "crypto";
// 회원가입
export const register = async (request: NextRequest): Promise<APIResult> => {
  try {

    if (request.method !== 'POST') {
      return await setMessage('InvalidType', null, 405);
    }

    // Validate request body using Zod schema
    const validation = await validateApiRequest(registerSchema, request);
    if (!validation.success) {
      logger.auth.warn('Registration validation failed', validation.errors);
      return await setMessage('InvalidField', validation.errors, 400);
    }

    const { email, password, name } = validation.data!;

    // 기존 사용자 확인
    const existingUser = await findUserByEmail(email); // 변경: findUserByEmail 사용

    if (existingUser) {
      return await setMessage('AuthError',  null, 409);
    }

    // 비밀번호 해시 (argon2는 자체적으로 솔트 처리)
    const passwordHash = await argon2.hash(password);

    // 이메일 인증 토큰 생성
    const emailVerificationToken = randomUUID();
    const emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 사용자 생성
    const newUser = await createUser({ // 변경: createUser 사용
      email,
      name,
      auth: {
        create: {
          passwordHash,
          passwordSalt: '', // argon2 자체 솔트 사용
          emailVerificationToken,
          emailVerificationExpires,
          emailVerified: false
        }
      },
    });

    // 기본 역할 할당
    const userRole = await searchRole('user');
    if (userRole) {
      await setUserRole(newUser.id, userRole.id);
    } else {
      logger.auth.warn("Default 'user' role not found. User created without a role.", { userId: newUser.id });
    }

    // 이메일 인증 URL 생성
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const verificationUrl = `${baseUrl}/auth/verify?token=${emailVerificationToken}`;

    // 이메일 전송
    try {
      const emailContent = await registerEmail(verificationUrl);
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (error) {
      logger.email.error('Email sending failed during registration', { 
        email, 
        userId: newUser.id, 
        error 
      });
      // 사용자 생성은 성공했으므로 이메일 전송 실패만 로그 처리
    }

    return await setMessage('emailVerification', { emailVerification: true }, 200);
  } catch (error) {
    logger.auth.error('Registration failed', { error });
    return await setMessage('UnknownError', null, 500);
  }
};