export interface GameRelease {
  id: string;
  title: string;
  description: string;
  iframeUrl: string;
  thumbnailUrl: string;
  genre: string;
  version: string;
  releaseDate: string;
  views: number;
  features: string[];
  status: 'Live' | 'Beta' | 'Upcoming';
  author: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'Update' | 'Patch Notes' | 'Release' | 'Studio News';
  summary: string;
  content: string;
  pinned?: boolean;
  author: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalGames: number;
  recentPlays: {
    id: string;
    gameId: string;
    gameTitle: string;
    timestamp: string;
    device: string;
  }[];
}
