import type { ProductDetail, BundleResult, ReviewResult } from '@/types/coupang';

/**
 * Unified display function for all Coupang data
 */
export function show(
    productInfo?: ProductDetail | null,
    productRelated?: BundleResult | null,
    reviewData?: ReviewResult | null
): void {
    // Display product info if available
    if (productInfo) {
        showProduct(productInfo);
    }
    
    // Display bundle info if available
    if (productRelated) {
        showBundle(productRelated);
    }
    
    // Display review info if available
    if (reviewData) {
        showReviews(reviewData);
    }
}

function showProduct(productInfo: ProductDetail): void {
    console.log('\n=== 쿠팡 상품 상세 정보 (전체) ===\n');
    
    // API Status
    if (productInfo.apiStatus) {
        console.log('API 상태:');
        console.log(`  성공 여부: ${productInfo.success ? '성공' : '실패'}`);
        console.log(`  응답 코드: ${productInfo.apiStatus.code}`);
        console.log(`  메시지: ${productInfo.apiStatus.message}`);
        console.log('');
    }
    
    if (!productInfo.success) return;
    
    // Product Info
    if (productInfo.product?.title) {
        console.log('상품 정보:');
        console.log(`  제품명: ${productInfo.product.title}`);
        console.log('');
    }
    
    // Pricing
    if (productInfo.pricing) {
        console.log('가격 정보:');
        if (productInfo.pricing.originalPrice) {
            console.log(`  정가: ${productInfo.pricing.originalPrice.toLocaleString()}원`);
        }
        if (productInfo.pricing.finalPrice) {
            console.log(`  최종가격: ${productInfo.pricing.finalPrice.toLocaleString()}원`);
        }
        if (productInfo.pricing.discountRate) {
            console.log(`  할인율: ${productInfo.pricing.discountRate}%`);
        }
        if (productInfo.pricing.unitPrice) {
            console.log(`  단위가격: ${productInfo.pricing.unitPrice}`);
        }
        console.log('');
    }
    
    // Vendor
    if (productInfo.vendor?.name) {
        console.log('판매자 정보:');
        console.log(`  판매자명: ${productInfo.vendor.name}`);
        if (productInfo.vendor.description) {
            console.log(`  설명: ${productInfo.vendor.description}`);
        }
        if (productInfo.vendor.logo) {
            console.log(`  로고: ${productInfo.vendor.logo}`);
        }
        console.log('');
    }
    
    // Delivery
    if (productInfo.delivery) {
        console.log('배송 정보:');
        if (productInfo.delivery.fee) {
            console.log(`  배송비: ${productInfo.delivery.fee}`);
        }
        if (productInfo.delivery.estimatedDate) {
            console.log(`  도착 예정: ${productInfo.delivery.estimatedDate}`);
        }
        if (productInfo.delivery.rocketDelivery) {
            console.log('  로켓배송: O');
        }
        console.log('');
    }
    
    // Ratings
    if (productInfo.ratings && productInfo.ratings.average !== null) {
        console.log('평점 정보:');
        console.log(`  평균 평점: ${productInfo.ratings.average}점`);
        console.log(`  리뷰 수: ${productInfo.ratings.count}개`);
        console.log(`  하이라이트 리뷰: ${productInfo.ratings.isHighLight ? '있음' : '없음'}`);
        console.log('');
    }
    
    // Images
    if (productInfo.images && productInfo.images.length > 0) {
        console.log('상품 이미지:');
        console.log(`  총 ${productInfo.images.length}개 이미지`);
        // 전체 이미지 표시
        productInfo.images.forEach((image, index) => {
            console.log(`  ${index + 1}. 타입: ${image.type}`);
            console.log(`     원본: ${image.source}`);
        });
        console.log('');
    }
    
    // Badges
    if (productInfo.badges && productInfo.badges.length > 0) {
        console.log('배지 정보:');
        productInfo.badges.forEach(badge => {
            console.log(`  - ${badge.text} (${badge.type})`);
        });
        console.log('');
    }
    
    // Stock
    if (productInfo.stock) {
        console.log('재고 정보:');
        console.log(`  재고 상태: ${productInfo.stock.available ? '재고 있음' : '품절'}`);
        if (productInfo.stock.quantity) {
            console.log(`  구매 가능 수량: ${productInfo.stock.quantity}개`);
        }
        console.log('');
    }
    
    // Options
    if (productInfo.options && productInfo.options.length > 0) {
        console.log('옵션 정보:');
        productInfo.options.forEach((option, index) => {
            console.log(`  ${index + 1}. ${option.name}`);
            console.log(`     Item ID: ${option.itemId}`);
            console.log(`     Vendor Item ID: ${option.vendorItemId}`);
        });
        console.log('');
    }
    
    // Summary
    console.log('요약 정보:');
    console.log(`  총 이미지: ${productInfo.images?.length || 0}개`);
    console.log(`  비디오 포함: ${productInfo.images?.some(img => img.isVideo) ? '있음' : '없음'}`);
    if (productInfo.ratings?.average) {
        console.log(`  평균 평점: ${productInfo.ratings.average}점`);
    }
    if (productInfo.pricing?.finalPrice) {
        console.log(`  가격대: ${productInfo.pricing.finalPrice.toLocaleString()}원`);
    }
    console.log('');
}


function showBundle(bundleData: BundleResult): void {
    if (!bundleData.success || !bundleData.products || bundleData.products.length === 0) {
        return;
    }
    
    console.log('=== 쿠팡 함께 구매하는 상품 ===\n');
    
    // Bundle info
    if (bundleData.bundleInfo) {
        console.log('묶음 상품 정보:');
        console.log(`  ${bundleData.bundleInfo.title}`);
        console.log('');
    }
    
    // Summary
    if (bundleData.summary) {
        console.log('요약 정보:');
        console.log(`  총 상품 수: ${bundleData.summary.totalProducts}개`);
        console.log(`  총 가격: ${bundleData.summary.totalPrice.toLocaleString()}원`);
        console.log(`  평균 평점: ${bundleData.summary.avgRating}점`);
        console.log('');
    }
    
    // Products
    console.log('상품 목록:');
    bundleData.products.forEach((product, index) => {
        console.log(`  ${index + 1}. [${product.brand}] ${product.title}`);
        console.log(`     가격: ${product.finalPrice}원`);
        console.log(`     평점: ${product.rating}점 (리뷰 ${product.reviewCount}개)`);
        console.log(`     판매상태: ${product.soldOut ? '품절' : '판매중'}`);
    });
    console.log('');
}

function showReviews(reviewData: ReviewResult): void {
    console.log('\n=== 쿠팡 상품 리뷰 ===\n');
    
    if (!reviewData.success) {
        console.log(`리뷰 조회 실패: ${reviewData.error}`);
        return;
    }
    
    // Metadata information
    if (reviewData.metadata) {
        console.log('데이터 상태:');
        console.log(`  데이터 유형: ${reviewData.metadata.dataAvailable === 'full_reviews' ? '전체 리뷰' : '요약 정보만'}`);
        console.log(`  참고: ${reviewData.metadata.note}`);
        if (reviewData.metadata.reviewActionUrl) {
            console.log(`  리뷰 URL: ${reviewData.metadata.reviewActionUrl.substring(0, 50)}...`);
        }
        console.log('');
    }
    
    // Summary
    if (reviewData.summary) {
        console.log('리뷰 요약:');
        console.log(`  총 리뷰 수: ${reviewData.summary.totalReviews}개`);
        console.log(`  평균 평점: ${reviewData.summary.averageRating}점`);
        if (reviewData.summary.hasHighlightReview) {
            console.log(`  하이라이트 리뷰: 있음`);
        }
        
        if (reviewData.summary.ratingDistribution && Object.keys(reviewData.summary.ratingDistribution).length > 0) {
            console.log('  평점 분포:');
            for (let i = 5; i >= 1; i--) {
                const dist = reviewData.summary.ratingDistribution[`${i}star`];
                if (dist) {
                    const stars = '*'.repeat(i);
                    const bar = '='.repeat(Math.floor(dist.percentage / 5));
                    console.log(`    ${stars} ${dist.percentage}% ${bar} (${dist.count}개)`);
                }
            }
        }
        console.log('');
    }
    
    // Reviews
    if (reviewData.reviews && reviewData.reviews.length > 0) {
        console.log(`리뷰 목록 (${reviewData.reviews.length}개):`);
        console.log('');
        reviewData.reviews.forEach((review, index) => {
            console.log(`  ${index + 1}. ${review.userName} ${'*'.repeat(review.rating || 0)}`);
            if (review.title) {
                console.log(`     제목: ${review.title}`);
            }
            if (review.content) {
                const content = review.content.substring(0, 100);
                console.log(`     내용: ${content}${review.content.length > 100 ? '...' : ''}`);
            }
            if (review.options) {
                console.log(`     옵션: ${review.options}`);
            }
            if (review.date) {
                console.log(`     작성일: ${review.date}`);
            }
            if (review.helpfulCount > 0) {
                console.log(`     도움됨: ${review.helpfulCount}`);
            }
            if (review.verified) {
                console.log(`     구매인증: O`);
            }
            if (review.images && review.images.length > 0) {
                console.log(`     사진: ${review.images.length}장`);
                review.images.forEach((img, imgIndex) => {
                    console.log(`       ${imgIndex + 1}. 썸네일: ${img.thumbnail}`);
                    console.log(`          원본: ${img.original}`);
                });
            }
            console.log('');
        });
    } else if (reviewData.summary.totalReviews > 0) {
        console.log('리뷰 내용:');
        console.log(`  총 ${reviewData.summary.totalReviews}개의 리뷰가 있습니다.`);
        console.log(`  브라우저에서 다음 URL로 접속하면 전체 리뷰를 볼 수 있습니다:`);
        console.log('');
    } else {
        console.log('  등록된 리뷰가 없습니다.');
        console.log('');
    }
    
    console.log(`페이지: ${reviewData.page + 1}`);
    console.log('');
}