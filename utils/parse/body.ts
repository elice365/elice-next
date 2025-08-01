import { NextRequest } from "next/server";

export const safeBody = async <T = any>(request: NextRequest): Promise<T> => {
    const contentType = request.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            return await request.json();
        }

        if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            return Object.fromEntries(formData.entries()) as T;
        }
        throw new Error(`Unsupported content type: ${contentType}`);
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to parse request body');
    }
};