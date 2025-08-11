// Response Library Type Definitions

export interface Response {
  success: boolean;
  message?: string;
  data: null;
  status: number;
}

export type Message =
  | "NotFoundData"
  | "InvalidField"
  | "InvalidType"
  | "Logout"
  | "APILimit"
  | "BadRequest"
  | "AuthError"
  | "AuthType"
  | "Unauthorized"
  | "NotFound"
  | "NetworkError"
  | "UnknownError"
  | "TokenDenied"
  | "InvalidToken"
  | "TokenExpired"
  | "TokenVerification"
  | "loginSuccess"
  | "emailVerification"
  | "AccountSuspended"
  | "AccountInactive"
  | "DuplicateField"
  | "ConflictError"
  | "Forbidden";