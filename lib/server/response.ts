import { NextResponse } from "next/server";

interface ResponseParams {
  success: boolean;
  message?: string;
  data?: any;
  status?: number;
}

export const createResponse = ({ success, message, data, status = 200}: ResponseParams): NextResponse => {
  const response = { success, message, data };
  return NextResponse.json(response, { status,  headers: { 'Content-Type': 'application/json' } });
};
