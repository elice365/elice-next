import { JwtPayload } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
  userId?: string;
  email?: string;
  roles?: string[];
  type: 'access' | 'refresh' | 'denied';
  message?:string;
  status?: number;
}
