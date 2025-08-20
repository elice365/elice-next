// Notice type definitions

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  link?: string;
  isImportant?: boolean;
  author?: {
    name: string;
  };
  readCount?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  startsTime?: Date;
  endsTime?: Date;
  isRead?: boolean;
}

export interface NoticeListResponse {
  success: boolean;
  data: {
    notices?: NoticeItem[];
    hasMore?: boolean;
    totalCount?: number;
  } | NoticeItem[];
  message?: string;
}