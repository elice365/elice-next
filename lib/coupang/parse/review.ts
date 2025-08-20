import type { Review, ReviewResult } from '@/types/coupang';

/**
 * Parse review data from API response
 */
export function parseReviews(
    data: any,
    productId: string,
    page: number,
    size: number
): ReviewResult {
    const result: ReviewResult = {
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
            note: '전체 리뷰 내용은 별도 API 호출이 필요합니다'
        }
    };
    
    if (data?.rCode !== 'RET0000') {
        result.error = data?.rMessage || 'API error';
        return result;
    }
    
    result.success = true;
    
    // Parse reviews from the complex nested structure
    if (data.rData?.pageList) {
        data.rData.pageList.forEach((page: any, pageIdx: number) => {
            if (page.widgetList) {
                page.widgetList.forEach((widget: any, widgetIdx: number) => {
                    const entity = widget.entity;
                    if (!entity) return;
                    
                    // Look for review summary widget
                    if (entity.review) {
                        // Extract summary data
                        result.summary.totalReviews = entity.review.ratingCount || 0;
                        result.summary.averageRating = entity.review.ratingAverage || 0;
                        result.summary.hasHighlightReview = entity.review.isHighLightReview || false;
                        
                        // Extract review action URL if available
                        if (entity.review.action?.event?.url) {
                            result.metadata.reviewActionUrl = entity.review.action.event.url;
                        }
                        
                        // Rating distribution (if exists)
                        if (entity.review.ratingPercentages) {
                            entity.review.ratingPercentages.forEach((rp: any) => {
                                result.summary.ratingDistribution[`${rp.rating}star`] = {
                                    count: rp.count || 0,
                                    percentage: rp.percentage || 0
                                };
                            });
                        }
                        
                        // Log for debugging
                        console.log(`  📍 Found review summary at pageList[${pageIdx}].widgetList[${widgetIdx}]`);
                    }
                    
                    // Try multiple possible review list structures
                    const reviewFields = [
                        entity.reviews,
                        entity.reviewList,
                        entity.reviewItems,
                        entity.productReviews,
                        entity.userReviews,
                        entity.customerReviews
                    ];
                    
                    reviewFields.forEach(field => {
                        if (field && Array.isArray(field) && field.length > 0) {
                            console.log(`  📍 Found review array with ${field.length} items`);
                            field.forEach((review: any) => {
                                const parsedReview = extractReview(review);
                                if (parsedReview) {
                                    result.reviews.push(parsedReview);
                                }
                            });
                        }
                    });
                    
                    // Check for review-related viewTypes
                    if (entity.viewType) {
                        const reviewTypes = [
                            'PRODUCT_DETAIL_REVIEW_LIST',
                            'REVIEW_LIST',
                            'REVIEW_ITEM',
                            'USER_REVIEW',
                            'CUSTOMER_REVIEW'
                        ];
                        
                        if (reviewTypes.some(type => entity.viewType.includes(type))) {
                            console.log(`  📍 Found review viewType: ${entity.viewType}`);
                            
                            // Try to extract review data from various possible structures
                            if (entity.items && Array.isArray(entity.items)) {
                                entity.items.forEach((item: any) => {
                                    const parsedReview = extractReview(item);
                                    if (parsedReview) {
                                        result.reviews.push(parsedReview);
                                    }
                                });
                            }
                        }
                    }
                });
            }
        });
    }
    
    // Check for Next API review format (actual browser response)
    if (data.rCode === 'RET0000' && data.rData?.paging?.contents) {
        const paging = data.rData.paging;
        const contents = paging.contents;
        const ratingSummary = data.rData.ratingSummaryTotal;
        
        console.log(`  Found Next API review format with ${contents.length} reviews`);
        
        // Parse actual review data
        result.success = true;
        result.page = paging.currentPage - 1;
        result.size = paging.sizePerPage;
        result.summary.totalReviews = paging.totalCount;
        result.totalPages = paging.totalPage;
        
        // Parse rating summary
        if (ratingSummary) {
            result.summary.averageRating = ratingSummary.ratingAverage;
            result.summary.totalReviews = ratingSummary.ratingCount;
            if (ratingSummary.ratingSummaries) {
                ratingSummary.ratingSummaries.forEach((item: any) => {
                    result.summary.ratingDistribution[`${item.rating}star`] = {
                        count: item.count,
                        percentage: item.percentage
                    };
                });
            }
        }
        
        // Parse review contents
        contents.forEach((review: any) => {
            result.reviews.push({
                reviewId: review.reviewId,
                rating: review.rating,
                title: review.title || '',
                content: review.content || '',
                date: new Date(review.reviewAt).toISOString(),
                userName: review.displayName || review.member?.name || '익명',
                displayWriter: review.displayWriter,
                helpfulCount: review.helpfulCount || 0,
                images: review.attachments?.filter((a: any) => a.attachmentType === 'IMAGE').map((img: any) => ({
                    thumbnail: img.imgSrcThumbnail,
                    original: img.imgSrcOrigin
                })) || [],
                itemName: review.itemName,
                options: review.itemName,  // Use itemName as options
                verified: review.displayWriter === '쿠팡실구매자',
                surveyAnswers: review.reviewSurveyAnswers?.map((a: any) => ({
                    question: a.question,
                    answer: a.answer
                })) || []
            });
        });
        
        result.metadata.dataAvailable = 'full_reviews';
        result.metadata.note = `${contents.length}개 리뷰 로드 완료 (전체 ${paging.totalCount}개 중)`;
        
        return result;
    }
    
    // Direct check for reviews at top level
    if (data.rData) {
        const topLevelReviewFields = [
            data.rData.reviews,
            data.rData.reviewList,
            data.rData.reviewItems,
            data.rData.productReviews,
            data.rData.userReviews
        ];
        
        topLevelReviewFields.forEach(field => {
            if (field && Array.isArray(field) && field.length > 0) {
                console.log(`  📍 Found top-level review array with ${field.length} items`);
                field.forEach((review: any) => {
                    const parsedReview = extractReview(review);
                    if (parsedReview) {
                        result.reviews.push(parsedReview);
                    }
                });
            }
        });
    }
    
    // Update metadata based on what was found
    if (result.reviews.length > 0) {
        result.metadata.dataAvailable = 'full_reviews';
        result.metadata.note = '리뷰 데이터를 성공적으로 파싱했습니다';
    } else if (result.summary.totalReviews > 0) {
        result.metadata.dataAvailable = 'summary_only';
        result.metadata.note = `총 ${result.summary.totalReviews}개의 리뷰가 있지만 상세 내용은 별도 API 필요`;
    }
    
    return result;
}

/**
 * Extract review data from various possible structures
 */
function extractReview(review: any): Review | null {
    if (!review || typeof review !== 'object') return null;
    
    // Try to extract review content from various possible field names
    const content = review.content || review.text || review.comment || 
                   review.message || review.reviewContent || review.body ||
                   review.description || review.reviewText || '';
    
    // Only create review object if there's actual content or basic info
    if (content || review.rating || review.score || review.title) {
        return {
            reviewId: review.reviewId || review.id || review.reviewNo || '',
            rating: review.rating || review.score || review.starRating || 0,
            title: review.title || review.subject || review.headline || '',
            content: content,
            date: review.createdAt || review.date || review.createDate || 
                  review.writtenAt || review.reviewDate || new Date().toISOString(),
            userName: review.userName || review.memberName || review.author || 
                     review.writerName || review.nickname || '익명',
            displayWriter: review.displayWriter,
            helpfulCount: review.helpfulCount || review.likeCount || 
                         review.thumbsUp || review.helpful || 0,
            images: (review.images || review.imageUrls || review.photos || 
                   review.attachments || []).map((img: any) => {
                       if (typeof img === 'string') {
                           return { thumbnail: img, original: img };
                       }
                       return {
                           thumbnail: img.thumbnail || img.imgSrcThumbnail || img.url || '',
                           original: img.original || img.imgSrcOrigin || img.url || ''
                       };
                   }),
            itemName: review.itemName || review.productOptions || 
                    review.optionName || review.variant || '',
            options: review.itemName || review.productOptions || 
                    review.optionName || review.variant || undefined,
            verified: review.verified || review.isPurchaseVerified || 
                     review.verifiedPurchase || false,
            surveyAnswers: review.surveyAnswers || []
        };
    }
    
    return null;
}