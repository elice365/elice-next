
export interface ButtonType{
    type:"button" | "submit" | "reset";
    name:string;
    className?:string;
    event?:string;
    disabled?:boolean;
    children?:React.ReactNode;
}