import { NextRequest } from "next/server";
import { createResponse } from "../server/response";
import { APIResult, AuthInfo, AuthOptions } from "@/types/api";
import { auth } from "@/lib/request/auth";
import { Message, setMessage, setRequest } from "@/lib/response";

export const handler = <T = any>(
    check: (request: NextRequest, context: AuthInfo & Record<string, any>) => Promise<APIResult<T>>,
    options: AuthOptions = {}
) => {
    return async (request: NextRequest, context?: any) => {
        try {

            const authContext = await auth(request, options);
            if(!authContext.access){
                return createResponse(await setMessage(authContext.message as Message, null, 401));
            }
            
            // context를 포함한 통합 컨텍스트 생성
            const fullContext = { ...authContext, ...context };
            const result = await check(request, fullContext);

            if (result.success) {
                return createResponse(setRequest(result.data));
            } else {
                // 핸들러 내부에서 정의된 에러 처리
                return createResponse(await setMessage("BadRequest", null, 400));
            }

        } catch (error : any) {
            console.error("Unhandled API Error:", error);
            return createResponse(await setMessage("NetworkError", null, 500));
        }
    };
};

