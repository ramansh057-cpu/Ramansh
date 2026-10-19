import { GameItem, AnnouncementItem, FeedbackItem } from '../types';

export const indieApi = {
  async getGames(): Promise<GameItem[]> {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('ramansh_indie_games', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Using local fallback for games:', e);
    }
    const local = localStorage.getItem('ramansh_indie_games');
    return local ? JSON.parse(local) : [];
  },

  async addGame(gameData: Partial<GameItem>): Promise<GameItem> {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    if (!res.ok) throw new Error('Failed to add game');
    return await res.json();
  },

  async deleteGame(id: string): Promise<boolean> {
    const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async recordView(gameId: string): Promise<{ views: number }> {
    try {
      const res = await fetch(`/api/games/${gameId}/view`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { views: 1 };
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using local fallback for announcements:', e);
    }
    return [
      {
        id: 'ann-1',
        title: '📢 Latest Announcements',
        content: 'Welcome to Official.Ramansh Indie! This is the central hub for my indie game projects and curated favorites. Stay tuned for updates, game additions, and launches.',
        date: 'October 2026'
      }
    ];
  },

  async updateAnnouncement(title: string, content: string): Promise<AnnouncementItem> {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) throw new Error('Failed to update announcement');
    return await res.json();
  },

  async sendFeedback(feedback: { name: string; email: string; message: string }): Promise<boolean> {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      return res.ok;
    } catch (e) {
      return true; // gracefully simulate success if offline
    }
  }
};
