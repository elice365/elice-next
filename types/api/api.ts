import { requestInfo } from "@/lib/server/info";

export interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export interface RateLimitResult {
    access: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
}

export interface APIResult<T = any> {
    success?: boolean;
    message?: string;
    data?: T;
}


export interface APIError {
    message: string;
    status: number;
}


export interface AuthInfo {
    access :boolean;
    message?:string;
    status?: number;
    userId?: string;
    email?: string;
    roles?: string[];
    deviceInfo: ReturnType<typeof requestInfo>;
}



export interface AuthOptions {
    auth?: boolean;
    roles?: string[];
    limit?: boolean;
}