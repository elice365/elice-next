// Global type declarations

declare global {
  interface Window {
    Kakao?: {
      Share: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description?: string;
            imageUrl?: string;
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
      };
    };
  }
}

export {};