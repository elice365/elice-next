import { Locale } from '@/i18n/route';

/**
 * 국가 코드를 언어 코드로 변환하는 함수
 * CloudFlare의 cf-ipcountry 헤더에서 받은 국가 코드를 언어 코드로 매핑
 */
export function country(countryCode: string): Locale {
  const countryLanguageMap: Record<string, Locale> = {
    // 한국어
    'KR': 'ko',
    
    // 영어권 국가들
    'US': 'en', // 미국
    'GB': 'en', // 영국
    'AU': 'en', // 호주
    'CA': 'en', // 캐나다
    'NZ': 'en', // 뉴질랜드
    'IE': 'en', // 아일랜드
    'ZA': 'en', // 남아프리카공화국
    'IN': 'en', // 인도
    'SG': 'en', // 싱가포르
    'MY': 'en', // 말레이시아
    'PH': 'en', // 필리핀
    
    // 일본어
    'JP': 'ja',
    
    // 러시아어권 국가들
    'RU': 'ru', // 러시아
    'BY': 'ru', // 벨라루스
    'KZ': 'ru', // 카자흐스탄
    'KG': 'ru', // 키르기스스탄
    'TJ': 'ru', // 타지키스탄
    'UZ': 'ru', // 우즈베키스탄
  };
  
  return countryLanguageMap[countryCode] || 'en'; // 기본값은 영어
}