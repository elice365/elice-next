// Coupang API Types

export interface ParseUrlResult {
    success: boolean;
    originalUrl?: string;
    redirectUrl?: string;
    productId?: string | null;
    itemId?: string | null;
    vendorItemId?: string | null;
    error?: string;
    statusCode?: number;
}

export interface CoupangProduct {
    productId: string;
    itemId?: string;
    vendorItemId?: string;
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    discountRate?: number;
    rating?: number;
    reviewCount?: number;
    imageUrl?: string;
    images?: string[];
    description?: string;
    category?: string;
    brand?: string;
    seller?: string;
    availability?: 'in-stock' | 'out-of-stock' | 'limited';
    deliveryInfo?: {
        type: string;
        fee?: number;
        estimatedDate?: string;
    };
    options?: Array<{
        name: string;
        values: string[];
    }>;
}

// Product Detail Types
export interface ProductDetail {
    success: boolean;
    apiStatus?: {
        code: string;
        message: string;
    };
    product?: {
        id: string | null;
        title: string;
        description: string;
        category: string;
        brand: string;
        attributes: any[];
    };
    pricing?: {
        originalPrice: number | null;
        salePrice: number | null;
        finalPrice: number | null;
        discountRate: number | null;
        unitPrice: string | null;
    };
    vendor?: {
        name: string | null;
        description: string | null;
        logo: string | null;
    };
    delivery?: {
        fee: string | null;
        type: string | null;
        estimatedDate: string | null;
        rocketDelivery: boolean;
    };
    ratings?: {
        average: number | null;
        count: number | null;
        isHighLight: boolean;
    };
    images?: Array<{
        type: string;
        source: string;
        isVideo: boolean;
    }>;
    badges?: Array<{
        type: string;
        text: string;
    }>;
    stock?: {
        available: boolean;
        quantity: number | null;
        soldOut: boolean;
    };
    options?: Array<{
        name: string | null;
        itemId: string | null;
        vendorItemId: string | null;
    }>;
    error?: string;
}

// Bundle Types
export interface BundleProduct {
    productId: string;
    itemId: string;
    vendorItemId: string;
    brand: string;
    title: string;
    productTitle?: string;
    finalPrice: string;
    unitPrice?: string;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    soldOut: boolean;
    badges: Array<{
        type: string;
        text: string;
    }>;
    vendor: {
        id: string;
        name: string;
    };
}

export interface BundleResult {
    success: boolean;
    bundleInfo?: {
        title: string;
        totalText: string;
        selectButtonText: string;
        unSelectButtonText: string;
        feedId: string;
    };
    products: BundleProduct[];
    summary?: {
        totalProducts: number;
        totalPrice: number;
        avgRating: string | number;
    };
    error?: string;
}

export interface GetDetailResult {
    success: boolean;
    data?: CoupangProduct;
    error?: string;
}

export interface CoupangApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    statusCode?: number;
}

// Review Types
export interface Review {
    reviewId: string;
    rating: number;
    title: string;
    content: string;
    date: string;
    userName: string;
    displayWriter?: string;
    helpfulCount: number;
    images: Array<{
        thumbnail: string;
        original: string;
    }>;
    itemName?: string;
    options?: string;  // Product options/variant selected for this review
    verified: boolean;
    surveyAnswers: Array<{
        question: string;
        answer: string;
    }>;
}

export interface ReviewSummary {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
        [key: string]: {
            count: number;
            percentage: number;
        };
    };
    hasHighlightReview: boolean;
}

export interface ReviewResult {
    success: boolean;
    productId: string;
    page: number;
    size: number;
    reviews: Review[];
    summary: ReviewSummary;
    totalPages?: number;
    metadata: {
        reviewActionUrl: string | null;
        dataAvailable: 'full_reviews' | 'summary_only';
        note: string;
    };
    error?: string;
}