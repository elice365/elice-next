import { request } from '@/lib/fetch';
import type { ParseUrlResult } from '@/types/coupang';

export async function parseUrl(url: string): Promise<ParseUrlResult> {
    try {
        console.log(' 단축 URL 분석 중:', url);
        
        const { headers } = await request.get<any>(url, {
            maxRedirects: 0,  // 리다이렉트 따라가지 않기
            validateStatus: (status: number) => status < 400,  // 3xx도 성공으로 처리
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        
        // Get status from headers (axios includes status in response headers)
        const statusCode = parseInt(headers?.status || '200');
        
            const redirectUrl = headers?.location;
            
            if (!redirectUrl) {
                return {
                    success: false,
                    error: 'No redirect URL found in headers',
                    statusCode: statusCode
                };
            }
            
            console.log('   리다이렉트 URL:', redirectUrl);
            
            // URL 파싱
            const urlObj = new URL(redirectUrl);
            const params = new URLSearchParams(urlObj.search);
            const pathMatch = urlObj.pathname.match(/\/products\/(\d+)/);
            
            const result: ParseUrlResult = {
                success: true,
                originalUrl: url,
                redirectUrl: redirectUrl,
                productId: pathMatch ? pathMatch[1] : null,
                itemId: params.get('itemId'),
                vendorItemId: params.get('vendorItemId')
            };
            
            console.log('    상품 정보 추출:');
            console.log(`      Product ID: ${result.productId}`);
            console.log(`      Item ID: ${result.itemId}`);
            console.log(`      Vendor Item ID: ${result.vendorItemId}`);
            
            return result;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ 단축 URL 파싱 실패:', errorMessage);
        return {
            success: false,
            error: errorMessage
        };
    }
}
