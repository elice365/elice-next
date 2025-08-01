import { randomUUID } from "crypto";
import { requestInfo } from "../server/info";
import { prisma } from "./prisma";

export async function history(
  email: string, 
  successful: boolean, 
  clientInfo: ReturnType<typeof requestInfo>
): Promise<void> {
  try {
    await prisma.history.create({
      data: {
        uid: randomUUID(),
        email,
        successful,
        ipAddress: clientInfo.ipAddress as string,
        userAgent: clientInfo.userAgent || null,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to create login record:', error);
    // 로그인 기록 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}
