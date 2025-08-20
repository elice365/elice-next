'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/fetch';
import type { APIResult } from '@/types/api';

// Payment method types
type PaymentMethod = 'card' | 'bank' | 'kakao' | 'naver' | 'toss';

// Payment plan types
interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
  discount?: number;
}

// Mock payment plans
const paymentPlans: PaymentPlan[] = [
  {
    id: 'basic',
    name: '베이직',
    price: 9900,
    features: [
      '기본 기능 이용',
      '월 100개 포스트',
      '이메일 지원'
    ]
  },
  {
    id: 'pro',
    name: '프로',
    price: 29900,
    originalPrice: 39900,
    discount: 25,
    popular: true,
    features: [
      '모든 기능 이용',
      '무제한 포스트',
      '우선 지원',
      '고급 분석',
      'API 접근'
    ]
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈',
    price: 99900,
    features: [
      '커스텀 기능',
      '무제한 사용',
      '전담 지원',
      'SLA 보장',
      '커스텀 API',
      '팀 협업 도구'
    ]
  }
];

export default function PaymentPage() {
  const t = useTranslations('payment');
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handlePayment = async () => {
    if (!agreeTerms) {
      alert(t('agreeRequired'));
      return;
    }

    const plan = paymentPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    try {
      setLoading(true);
      
      // API call to initiate payment
      const response = await api.post<APIResult<{ paymentUrl?: string }>>('/api/payment/initiate', {
        planId: selectedPlan,
        method: selectedMethod,
        amount: plan.price
      });

      if (response.data.success) {
        // Redirect to payment gateway or show success
        if (response.data.data?.paymentUrl) {
          window.location.href = response.data.data.paymentUrl;
        } else {
          alert(t('paymentSuccess'));
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert(t('paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">
          {t('title')}
        </h1>
        <p className="text-gray-600 text-center mb-8">
          {t('subtitle')}
        </p>

        {/* Payment Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {paymentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
                    {t('popular')}
                  </span>
                </div>
              )}

              <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
              
              <div className="mb-4">
                {plan.originalPrice && (
                  <div className="text-gray-400 line-through text-sm">
                    {formatPrice(plan.originalPrice)}
                  </div>
                )}
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price)}
                  <span className="text-base font-normal text-gray-600">/월</span>
                </div>
                {plan.discount && (
                  <div className="text-sm text-red-500 font-semibold">
                    {plan.discount}% {t('discount')}
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  selectedPlan === plan.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id
                  ? t('selected')
                  : t('select')}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Method */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('paymentMethod')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: 'card', name: '신용/체크카드', icon: '💳' },
              { id: 'bank', name: '계좌이체', icon: '🏦' },
              { id: 'kakao', name: '카카오페이', icon: '🟡' },
              { id: 'naver', name: '네이버페이', icon: '🟢' },
              { id: 'toss', name: '토스', icon: '🔵' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{method.icon}</div>
                <div className="text-sm">{method.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 mr-3"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('terms')}
              <a href="/terms" className="text-primary hover:underline ml-1">
                {t('viewTerms')}
              </a>
            </span>
          </label>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-3">{t('summary')}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('plan')}</span>
              <span className="font-medium">
                {paymentPlans.find(p => p.id === selectedPlan)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('method')}</span>
              <span className="font-medium">
                {selectedMethod === 'card' && '신용/체크카드'}
                {selectedMethod === 'bank' && '계좌이체'}
                {selectedMethod === 'kakao' && '카카오페이'}
                {selectedMethod === 'naver' && '네이버페이'}
                {selectedMethod === 'toss' && '토스'}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('total')}</span>
                <span className="text-primary">
                  {formatPrice(paymentPlans.find(p => p.id === selectedPlan)?.price || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading || !agreeTerms}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            loading || !agreeTerms
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('processing')}
            </span>
          ) : (
            t('pay')
          )}
        </button>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('secure')}</p>
          <div className="flex justify-center items-center gap-4 mt-2">
            <span>🔒 SSL</span>
            <span>PCI DSS</span>
            <span>3D Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}