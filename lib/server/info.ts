import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const requestInfo = (request: NextRequest) => {
  return {
    ipAddress: request.headers.get("X-Forwarded-For")?.split(",")[0].replace(/^::ffff:/, ''),
    userAgent: request.headers.get('user-agent')
  };
};

export async function getAgent(): Promise<string> {
  const ip = await headers();
  return ip?.get('user-agent') as string;
};

export async function requestIP(request: NextRequest): Promise<string> {
  return request.headers.get("X-Forwarded-For")?.split(",")[0].replace(/^::ffff:/, '') as string;
}

export async function getIP(): Promise<string> {
  const ip = await headers();
  return ip.get("X-Forwarded-For")?.split(",")[0].replace(/^::ffff:/, '') as string;
}

