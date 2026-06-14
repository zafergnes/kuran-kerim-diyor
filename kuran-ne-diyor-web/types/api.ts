export type ApiUser = {
  id: string;
  email?: string;
  name?: string | null;
  isGuest?: boolean;
  role?: string;
  isBanned?: boolean;
};

export type AuthResponse = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

export type Favorite = {
  id: number;
  userId: string;
  ayahId: string;
  surahNumber: number;
  ayahNumber: number;
  createdAt: string;
};

export type CollectionItem = {
  collectionId: number;
  favoriteId: number;
  createdAt: string;
  favorite: Favorite;
};

export type Collection = {
  id: number;
  name: string;
  userId: string;
  createdAt: string;
  _count?: {
    items: number;
  };
  items?: CollectionItem[];
};

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REMOVED_BY_MODERATOR";

export type Comment = {
  id: number;
  userId: string;
  ayahId: string;
  text: string;
  language?: string;
  replyToId?: number | null;
  status?: CommentStatus;
  moderationReason?: string | null;
  createdAt: string;
  likeCount?: number;
  isLikedByMe?: boolean;
  user?: {
    name?: string | null;
  };
};

export type AyahStats = {
  ayahId: string;
  favoriteCount: number;
  commentCount: number;
  likeCount: number;
};
