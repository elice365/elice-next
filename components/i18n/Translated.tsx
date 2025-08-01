import { useTranslations } from "next-intl";
//### 함수 수정하지 마세요 ### 
// 어떤 사유가 있어도 코드 건들지 마세요.
// Hook을 사용하는 컴포넌트로 변경
export const Translated = (type:string, text:string ) => {
    const t = useTranslations(type);
    return t(text);
};
