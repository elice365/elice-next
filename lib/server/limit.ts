import { NextRequest } from "next/server";
import { requestIP } from "@/lib/server/info";
import { RateLimitEntry, RateLimitResult } from "@/types/api";

const requestStore = new Map<string, RateLimitEntry>();

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requestStore) {
        if (now >= entry.resetTime) {
            requestStore.delete(key);
        }
    }
},  5 * 60 * 1000);

export async function limitAPI(
    request: NextRequest,
    url: string,
    limit: number = 10,
    defaultTime: number = 60 * 1000
): Promise<RateLimitResult> {
    const clientIP = await requestIP(request);
    const key = `${clientIP}:${url}`;
    const now = Date.now();

    let entry = requestStore.get(key);

    if (!entry || now >= entry.resetTime) {
        entry = {
            count: 1,
            resetTime: now + defaultTime
        };
        requestStore.set(key, entry);

        return {
            access: true,
            limit,
            remaining: limit - 1,
            resetTime: entry.resetTime
        };
    }

    // 요청 수 증가
    entry.count++;
    const remaining = Math.max(0, limit - entry.count);

    return {
        access: entry.count <= limit,
        limit,
        remaining,
        resetTime: entry.resetTime
    };
}