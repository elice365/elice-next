// Global type declarations

interface KakaoShare {
  sendDefault: (settings: {
    objectType: string;
    content: {
      title: string;
      description: string;
      imageUrl: string;
      link: {
        mobileWebUrl: string;
        webUrl: string;
      };
    };
    buttons?: Array<{
      title: string;
      link: {
        mobileWebUrl: string;
        webUrl: string;
      };
    }>;
  }) => void;
}

interface KakaoSDK {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: KakaoShare;
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

export {};