import { info } from "./info";
import { parseUrl } from "./parse/url";
import { related } from "./related";
import { reviews } from "./reviews";
import { show } from "./log/show";
import type { ProductDetail, BundleResult, ReviewResult } from '@/types/coupang';

export interface ProductResult {
    productInfo: ProductDetail | null;
    productRelated: BundleResult | null;
    reviewData: ReviewResult | null;
    metadata: {
        fetchedAt: string;
        requestParams: {
            productId: string;
            itemId: string | null;
            vendorItemId: string | null;
            url: string;
            originalUrl: string;
        };
    };
}

export async function product(url: string): Promise<ProductResult | null> {
    try {
        let productId, vendorItemId, itemId;
        let actualUrl = url;
        
        // Check if it's a short URL
        if (url.includes('https://link.coupang.com/a/')) {
            console.log(' 단축 URL 감지됨. 리다이렉트 URL을 파싱합니다...');
            const shortUrlResult = await parseUrl(url);
            
            if (!shortUrlResult.success) {
                console.log('❌ 단축 URL 파싱 실패:', shortUrlResult.error);
                return null;
            }
            
            productId = shortUrlResult.productId || null;
            itemId = shortUrlResult.itemId || null;
            vendorItemId = shortUrlResult.vendorItemId || null;
            actualUrl = shortUrlResult.redirectUrl || url;
            
            console.log('단축 URL 파싱 완료');
            console.log(`   실제 URL: ${actualUrl}`);
        } else {
            // Parse regular URL
            const urlObj = new URL(url);
            const pathRegex = /\/products\/(\d+)/;
            const pathMatch = pathRegex.exec(urlObj.pathname);
            productId = pathMatch ? pathMatch[1] : null;
            vendorItemId = urlObj.searchParams.get('vendorItemId');
            itemId = urlObj.searchParams.get('itemId') || productId;
        }
        
        if (!productId) {
            console.log('❌ Invalid URL: Missing productId');
            return null;
        }
        
        // vendorItemId가 없는 경우 itemId를 사용하거나 productId를 대체값으로 사용
        if (!vendorItemId) {
            console.log('⚠️ vendorItemId가 없습니다. itemId 또는 productId를 대체값으로 사용합니다.');
            vendorItemId = itemId || productId;
        }
        
        console.log(` Processing: Product ${productId}, Item ${itemId || 'N/A'}, Vendor ${vendorItemId}`);
        
        // Fetch product detail, bundle data, and reviews
        const [productInfo, productRelated, reviewData] = await Promise.all([
            info(productId, itemId || productId, vendorItemId),
            related(productId, itemId || productId, vendorItemId),
            reviews(productId, itemId || undefined, vendorItemId || undefined, 0, 10, 'ORDER_SCORE_ASC')
        ]);
        
        // Display formatted output using unified show function
        show(productInfo, productRelated, reviewData);
        
        // Prepare result data
        const result: ProductResult = {
            productInfo,
            productRelated,
            reviewData,
            metadata: {
                fetchedAt: new Date().toISOString(),
                requestParams: {
                    productId,
                    itemId: itemId || null,
                    vendorItemId,
                    url: actualUrl,
                    originalUrl: url
                }
            }
        };
        
        
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error: ${errorMessage}`);
        return null;
    }
}
