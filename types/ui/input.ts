import { Field } from "@/utils/regex/input";

export interface InputProps {
    id?:string;
    name: Field;
    type: "text" | "email" | "password" | "tel" | "search";
    className?: string;
    required?: boolean;
    disabled?: boolean;
    autoComplete?:"on"|"off";
}

export interface InputExtend extends InputProps {
    showError?: boolean;
    OnChange?: boolean;
    OnBlur?: boolean;
    value?: string;
    compareValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}