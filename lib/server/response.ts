import { NextResponse } from "next/server";
import type { ResponseParams } from "@/types/lib/server";

export const createResponse = ({ success, message, data, status = 200}: ResponseParams): NextResponse => {
  const response = { success, message, data };
  return NextResponse.json(response, { status,  headers: { 'Content-Type': 'application/json' } });
};
