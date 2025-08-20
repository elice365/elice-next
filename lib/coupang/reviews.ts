import { request } from '@/lib/fetch';
import type { ReviewResult } from '@/types/coupang';
import { parseReviews } from './parse/review';

export type SortBy = 'ORDER_SCORE_ASC' | 'RECENT' | 'RATING_DESC' | 'RATING_ASC' | 'HELPFUL_DESC';

/**
 * Get product reviews from Coupang API
 * @param productId - Product ID
 * @param itemId - Item ID (optional)
 * @param vendorItemId - Vendor Item ID (optional)
 * @param page - Page number (0-based)
 * @param size - Number of reviews per page
 * @param sortBy - Sort option
 */
export async function reviews(
    productId: string,
    itemId?: string,
    vendorItemId?: string,
    page: number = 0,
    size: number = 10,
    sortBy: SortBy = 'ORDER_SCORE_ASC'
): Promise<ReviewResult> {
    // Next API endpoint - this endpoint works without cookies
    const actualPage = page + 1; // API uses 1-based pagination
    const apiUrl = `https://www.coupang.com/next-api/review?productId=${productId}&page=${actualPage}&size=${size}&sortBy=${sortBy}&ratingSummary=true&ratings=&market=`;

    try {
        console.log(`    요청 URL: ${apiUrl}`);
        
        const { data } = await request.get<any>(apiUrl, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Host': 'www.coupang.com',
                'Pragma': 'no-cache',
                'Referer': `https://www.coupang.com/vp/products/${productId}`,
                'Sec-Ch-Ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log(`    응답 크기: ${JSON.stringify(data).length} bytes`);

        // Parse the review data
        return parseReviews(data, productId, page, size);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ 리뷰 요청 실패: ${errorMessage}`);
        return {
            success: false,
            productId,
            page,
            size,
            reviews: [],
            summary: { 
                totalReviews: 0, 
                averageRating: 0,
                ratingDistribution: {},
                hasHighlightReview: false
            },
            metadata: {
                reviewActionUrl: null,
                dataAvailable: 'summary_only',
                note: '리뷰 데이터를 가져올 수 없습니다'
            },
            error: errorMessage
        };
    }
}