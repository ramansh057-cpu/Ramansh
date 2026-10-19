export interface GameItem {
  id: string;
  title: string;
  description: string;
  url: string;
  thumb: string;
  views: number;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}
