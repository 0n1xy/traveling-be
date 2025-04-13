export interface ITravelPost {
    id: string;
    title: string;
    description: string;
    location: string;
    imageUrls: string[];
    likes: string[];
    createdAt?: string; 
    createdBy?: {
      userId: string;
      username: string;
      avatarUrl: string;
    }; 
    ratingScore?: number; 
    reviewCount?: number;
    activities?: {
      time: string;
      name: string;
    }[];
    isFavorite?: boolean;
    isPublic?: boolean;
    
  }
  