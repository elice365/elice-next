import { NextRequest, NextResponse } from 'next/server';
import { product } from '@/lib/coupang/product';

/**
 * GET /api/coupang/product?url={coupangUrl}
 * 
 * Test endpoint for Coupang product information fetching
 * 
 * Example URLs:
 * - Regular: https://www.coupang.com/vp/products/123456789?itemId=123456789&vendorItemId=987654321
 * - Short: https://link.coupang.com/a/bMNXYZ
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const url = searchParams.get('url');
        
        if (!url) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'URL parameter is required',
                    example: '/api/coupang/product?url=https://www.coupang.com/vp/products/123456789'
                },
                { status: 400 }
            );
        }
        
        // Validate URL format
        if (!url.includes('coupang.com')) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Invalid URL. Must be a coupang.com URL',
                    provided: url
                },
                { status: 400 }
            );
        }
        
        console.log('\n========================================');
        console.log('   Coupang Product API');
        console.log(`    URL: ${url}`);
        console.log('========================================\n');
        
        // Fetch product information
        const result = await product(url);
        
        if (!result) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Failed to fetch product information',
                    url
                },
                { status: 500 }
            );
        }
        
        // Create response summary
        const summary = {
            success: true,
            url,
            timestamp: new Date().toISOString(),
            product: {
                found: result.productInfo?.success || false,
                title: result.productInfo?.product?.title || null,
                price: result.productInfo?.pricing?.finalPrice || null,
                rating: result.productInfo?.ratings?.average || null,
                reviewCount: result.productInfo?.ratings?.count || null
            },
            bundle: {
                found: result.productRelated?.success || false,
                productCount: result.productRelated?.products?.length || 0,
                totalPrice: result.productRelated?.summary?.totalPrice || null
            },
            reviews: {
                found: result.reviewData?.success || false,
                totalReviews: result.reviewData?.summary?.totalReviews || 0,
                averageRating: result.reviewData?.summary?.averageRating || null,
                reviewsLoaded: result.reviewData?.reviews?.length || 0
            },
            metadata: result.metadata
        };
        
        console.log('\n========================================');
        console.log('  Coupang Product API Completed');
        console.log('========================================\n');
        
        return NextResponse.json({
            success: true,
            summary,
            data: result
        });
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ API Error:', errorMessage);
        
        return NextResponse.json(
            { 
                success: false, 
                error: errorMessage,
                stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/coupang/product
 * 
 * Test endpoint with body payload
 * 
 * Body:
 * {
 *   "url": "https://www.coupang.com/vp/products/..."
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;
        
        if (!url) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'URL is required in request body',
                    example: {
                        url: 'https://www.coupang.com/vp/products/123456789?itemId=123456789&vendorItemId=987654321'
                    }
                },
                { status: 400 }
            );
        }
        
        // Validate URL format
        if (!url.includes('coupang.com')) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Invalid URL. Must be a coupang.com URL',
                    provided: url
                },
                { status: 400 }
            );
        }
        
        console.log('\n========================================');
        console.log('   Coupang Product API  (POST)');
        console.log(`    URL: ${url}`);
        console.log('========================================\n');
        
        // Fetch product information
        const result = await product(url);
        
        if (!result) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Failed to fetch product information',
                    url
                },
                { status: 500 }
            );
        }
        
        // Create detailed response
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            request: { url },
            summary: {
                productInfo: {
                    success: result.productInfo?.success || false,
                    hasData: !!result.productInfo?.product,
                    title: result.productInfo?.product?.title,
                    price: {
                        original: result.productInfo?.pricing?.originalPrice,
                        sale: result.productInfo?.pricing?.salePrice,
                        final: result.productInfo?.pricing?.finalPrice,
                        discountRate: result.productInfo?.pricing?.discountRate
                    },
                    vendor: result.productInfo?.vendor?.name,
                    delivery: {
                        fee: result.productInfo?.delivery?.fee,
                        estimatedDate: result.productInfo?.delivery?.estimatedDate,
                        rocketDelivery: result.productInfo?.delivery?.rocketDelivery
                    },
                    ratings: {
                        average: result.productInfo?.ratings?.average,
                        count: result.productInfo?.ratings?.count
                    },
                    imageCount: result.productInfo?.images?.length || 0,
                    optionCount: result.productInfo?.options?.length || 0
                },
                bundleInfo: {
                    success: result.productRelated?.success || false,
                    productCount: result.productRelated?.products?.length || 0,
                    products: result.productRelated?.products?.map(p => ({
                        title: p.title,
                        price: p.finalPrice,
                        rating: p.rating,
                        soldOut: p.soldOut
                    })) || [],
                    totalPrice: result.productRelated?.summary?.totalPrice
                },
                reviewInfo: {
                    success: result.reviewData?.success || false,
                    totalReviews: result.reviewData?.summary?.totalReviews || 0,
                    averageRating: result.reviewData?.summary?.averageRating || 0,
                    reviewsRetrieved: result.reviewData?.reviews?.length || 0,
                    dataAvailable: result.reviewData?.metadata?.dataAvailable,
                    topReviews: result.reviewData?.reviews?.slice(0, 3).map(r => ({
                        rating: r.rating,
                        title: r.title,
                        userName: r.userName,
                        verified: r.verified,
                        helpfulCount: r.helpfulCount,
                        hasImages: (r.images?.length || 0) > 0
                    })) || []
                }
            },
            fullData: result
        };
        
        console.log('\n========================================');
        console.log('  Coupang Product API Test Completed (POST)');
        console.log('========================================\n');
        
        return NextResponse.json(response);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ API Error:', errorMessage);
        
        return NextResponse.json(
            { 
                success: false, 
                error: errorMessage,
                stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
            },
            { status: 500 }
        );
    }
}