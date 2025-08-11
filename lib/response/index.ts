import { getTranslations } from "next-intl/server";
import type { Response, Message } from "@/types/lib/response";

export const setRequest = (data: any): Response => {
  return { success: true, data: data, status: 200 };
};

export const setMessage = async (
  message: Message,
  data: any,
  status: number
): Promise<Response> => {
  const t = await getTranslations("messages");
  return { 
    success: status === 200, // Use strict equality 
    message: t(message), 
    data: data, 
    status: status 
  };
};

// Optimized synchronous version for common cases
export const setMessageSync = (
  message: string,
  data: any,
  status: number
): Response => {
  return {
    success: status === 200,
    message,
    data,
    status
  };
};

// Helper for success responses
export const setSuccess = (data: any, message?: string): Response => {
  return {
    success: true,
    message,
    data,
    status: 200
  };
};

// Helper for error responses
export const setError = (message: string, status: number = 500): Response => {
  return {
    success: false,
    message,
    data: null,
    status
  };
};
