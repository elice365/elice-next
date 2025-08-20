import { request } from '@/lib/fetch';
import type { BundleResult, BundleProduct } from '@/types/coupang';

/**
 * Fetch bundle data from API with retry mechanism
 */
export async function related(
    productId: string,
    itemId: string,
    vendorItemId: string,
    retries: number = 3
): Promise<BundleResult> {
    const apiUrl = `https://m.coupang.com/vm/sdp/api/sdp/v1/vm/products/${productId}/items/${itemId}/vendor-items/${vendorItemId}/also-bought-bundle?productId=${productId}&vendorItemId=${vendorItemId}&itemId=${itemId}`;
    
    const attemptFetch = async (attemptNumber: number): Promise<BundleResult> => {
        try {
            if (attemptNumber < retries) {
                console.log(`  Bundle API attempt ${retries - attemptNumber + 1}/${retries}`);
            }
            
            const { data } = await request.get<any>(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Referer': 'https://m.coupang.com/',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 30000
            });
            
            if (!data || (typeof data === 'string' && data.trim() === '')) {
                throw new Error('Empty response');
            }
            
            const result = parseBundle(data);
            return result;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (attemptNumber > 0) {
                console.log(`  ⚠️ Attempt failed: ${errorMessage}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return attemptFetch(attemptNumber - 1);
            } else {
                return {
                    success: false,
                    products: [],
                    error: `Parse failed after ${retries} attempts: ${errorMessage}`
                };
            }
        }
    };
    
    return attemptFetch(retries - 1);
}

/**
 * Parse bundle data from API response
 */
function parseBundle(data: any): BundleResult {
    if (!data.productLists) {
        return {
            success: false,
            products: []
        };
    }
    
    const products: BundleProduct[] = data.productLists.map((product: any) => ({
        productId: product.productId,
        itemId: product.itemId,
        vendorItemId: product.vendorItemId,
        brand: product.brand?.name || 'Unknown',
        title: product.title,
        productTitle: product.productTitle,
        finalPrice: product.finalPrice,
        unitPrice: product.unitPrice,
        rating: product.reviewRatingPercent ? product.reviewRatingPercent / 10 : 0,
        reviewCount: product.reviewRatingRawCount || 0,
        imageUrl: product.imageUrl,
        soldOut: product.soldOut,
        badges: product.badgeDtos?.map((badge: any) => ({
            type: badge.type,
            text: badge.text
        })) || [],
        vendor: {
            id: product.vendorId,
            name: product.vendorName || 'Unknown'
        }
    }));
    
    return {
        success: true,
        bundleInfo: {
            title: data.title,
            totalText: data.totalText,
            selectButtonText: data.selectButtonText,
            unSelectButtonText: data.unSelectButtonText,
            feedId: data.feedId
        },
        products,
        summary: {
            totalProducts: products.length,
            totalPrice: products.reduce((sum, p) => {
                const price = parseInt(p.finalPrice?.replace(/,/g, '') || '0');
                return sum + price;
            }, 0),
            avgRating: products.length > 0 
                ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
                : 0
        }
    };
}
