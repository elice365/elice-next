import type { ProductDetail } from '@/types/coupang';

export function parseinfo(data: any): ProductDetail {
    const result: ProductDetail = {
        success: false,
        apiStatus: {
            code: data?.rCode || '',
            message: data?.rMessage || ''
        }
    };
    
    if (data?.rCode !== 'RET0000') {
        return result;
    }
    
    result.success = true;
    result.product = {
        id: null,
        title: '',
        description: '',
        category: '',
        brand: '',
        attributes: []
    };
    result.pricing = {
        originalPrice: null,
        salePrice: null,
        finalPrice: null,
        discountRate: null,
        unitPrice: null
    };
    result.vendor = {
        name: null,
        description: null,
        logo: null
    };
    result.delivery = {
        fee: null,
        type: null,
        estimatedDate: null,
        rocketDelivery: false
    };
    result.ratings = {
        average: null,
        count: null,
        isHighLight: false
    };
    result.images = [];
    result.badges = [];
    result.stock = {
        available: true,
        quantity: null,
        soldOut: false
    };
    result.options = [];
    
    // Parse product info from response
    if (data.rData?.pageList) {
        data.rData.pageList.forEach((page: any) => {
            if (page.widgetList) {
                page.widgetList.forEach((widget: any) => {
                    const entity = widget.entity;
                    if (!entity) return;
                    
                    // Extract product title and info
                    if (entity.viewType === 'PRODUCT_DETAIL_PRODUCT_INFO' && entity.title) {
                        result.product!.title = entity.title.map((t: any) => t.text || t).join('');
                    }
                    
                    // Extract pricing
                    if (entity.priceInfo) {
                        if (entity.priceInfo.finalPrice) {
                            const priceText = entity.priceInfo.finalPrice.map((p: any) => p.text || p).join('');
                            result.pricing!.finalPrice = parseInt(priceText.replace(/[^\d]/g, ''));
                        }
                        if (entity.priceInfo.originalPrice) {
                            const priceText = entity.priceInfo.originalPrice.map((p: any) => p.text || p).join('');
                            result.pricing!.originalPrice = parseInt(priceText.replace(/[^\d]/g, ''));
                        }
                        if (entity.priceInfo.discountRate) {
                            const discountText = entity.priceInfo.discountRate.map((r: any) => r.text || r).join('');
                            result.pricing!.discountRate = parseInt(discountText.replace(/[^\d]/g, ''));
                        }
                        if (entity.priceInfo.finalUnitPrice) {
                            result.pricing!.unitPrice = entity.priceInfo.finalUnitPrice.map((u: any) => u.text || u).join('');
                        }
                    }
                    
                    // Extract delivery info
                    if (entity.deliveryInfo) {
                        if (entity.deliveryInfo.shippingFee) {
                            result.delivery!.fee = entity.deliveryInfo.shippingFee.map((f: any) => f.text || f).join('');
                        }
                    }
                    if (entity.deliveryDate) {
                        result.delivery!.estimatedDate = entity.deliveryDate.map((d: any) => d.text || d).join('');
                    }
                    
                    // Check for rocket delivery
                    if (entity.flexBox?.children) {
                        const rocketBadge = entity.flexBox.children.find((child: any) => 
                            child.childData?.data?.url?.includes('rocket')
                        );
                        if (rocketBadge) {
                            result.delivery!.rocketDelivery = true;
                            result.delivery!.type = 'rocket';
                        }
                    }
                    
                    // Extract vendor info
                    if (entity.shopPlusIconBrandInfo) {
                        result.vendor!.name = entity.shopPlusIconBrandInfo.title?.[0]?.text || '';
                        result.vendor!.logo = entity.shopPlusIconBrandInfo.brandLogo?.url || null;
                        result.vendor!.description = entity.shopPlusIconBrandInfo.description?.[0]?.text || '';
                    }
                    
                    // Extract ratings
                    if (entity.review) {
                        result.ratings!.average = entity.review.ratingAverage || 0;
                        result.ratings!.count = entity.review.ratingCount || 0;
                        result.ratings!.isHighLight = entity.review.isHighLightReview || false;
                    }
                    
                    // Extract images
                    if (entity.viewType === 'PRODUCT_DETAIL_ITEM_THUMBNAILS' && entity.medias) {
                        result.images = entity.medias.map((media: any) => ({
                            type: media.type,
                            source: media.source,
                            isVideo: media.type === 'VIDEO'
                        }));
                    }
                    
                    // Extract badges
                    if (entity.topBadges) {
                        entity.topBadges.forEach((badge: any) => {
                            if (badge.rdsBadge?.textExpression) {
                                result.badges!.push({
                                    type: badge.id || 'unknown',
                                    text: badge.rdsBadge.textExpression.map((t: any) => t.data.text).join('')
                                });
                            }
                        });
                    }
                    
                    // Extract stock info
                    if (entity.stockInfo) {
                        result.stock!.soldOut = entity.stockInfo.soldOut || false;
                        result.stock!.available = !entity.stockInfo.soldOut;
                    }
                    if (entity.quantityPicker) {
                        result.stock!.quantity = entity.quantityPicker.buyableQuantity || null;
                    }
                    
                    // Extract options
                    if (entity.itemBasicInfo) {
                        result.options!.push({
                            name: entity.itemBasicInfo.itemName?.map((n: any) => n.text).join('') || null,
                            itemId: entity.itemBasicInfo.itemId || null,
                            vendorItemId: entity.itemBasicInfo.vendorItemId || null
                        });
                    }
                });
            }
        });
    }
    
    return result;
}
