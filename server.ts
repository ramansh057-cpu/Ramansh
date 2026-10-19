import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const GAMES_FILE = path.join(DATA_DIR, 'indie_games.json');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'indie_announcements.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'indie_feedback.json');

app.use(express.json());

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial games (empty - all games removed as requested)
const INITIAL_GAMES: any[] = [];

// Initial announcement
const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: '📢 Latest Announcements',
    content: 'Welcome to Official.Ramansh Indie! This is the central hub for my indie game projects and curated favorites. Stay tuned for updates, game additions, and launches.',
    date: 'October 2026'
  }
];

function readGames() {
  try {
    if (!fs.existsSync(GAMES_FILE)) {
      fs.writeFileSync(GAMES_FILE, JSON.stringify(INITIAL_GAMES, null, 2));
      return INITIAL_GAMES;
    }
    const data = fs.readFileSync(GAMES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return INITIAL_GAMES;
  }
}

function writeGames(games: any[]) {
  try {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
  } catch (err) {}
}

function readAnnouncements() {
  try {
    if (!fs.existsSync(ANNOUNCEMENTS_FILE)) {
      fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(INITIAL_ANNOUNCEMENTS, null, 2));
      return INITIAL_ANNOUNCEMENTS;
    }
    const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return INITIAL_ANNOUNCEMENTS;
  }
}

function writeAnnouncements(ann: any[]) {
  try {
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(ann, null, 2));
  } catch (err) {}
}

function readFeedback() {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) {
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeFeedback(fb: any[]) {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(fb, null, 2));
  } catch (err) {}
}

// API Endpoints

// 1. Get all games
app.get('/api/games', (req: Request, res: Response) => {
  const games = readGames();
  res.json(games);
});

// 2. Add / Upload a new game link
app.post('/api/games', (req: Request, res: Response) => {
  const { title, description, url, thumb } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and iframe URL are required' });
  }

  const games = readGames();
  const newGame = {
    id: `game-${Date.now()}`,
    title: title.trim(),
    description: (description || 'Official indie game release.').trim(),
    url: url.trim(),
    thumb: (thumb || '/src/assets/images/professional_studio_workspace_1792341210954.jpg').trim(),
    views: 0,
    createdAt: new Date().toISOString()
  };

  games.unshift(newGame);
  writeGames(games);

  res.status(201).json(newGame);
});

// 3. Delete a game
app.delete('/api/games/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let games = readGames();
  const len = games.length;
  games = games.filter((g: any) => g.id !== id);

  if (games.length === len) {
    return res.status(404).json({ error: 'Game not found' });
  }

  writeGames(games);
  res.json({ success: true });
});

// 4. Record a View (when user clicks Play Game)
app.post('/api/games/:id/view', (req: Request, res: Response) => {
  const { id } = req.params;
  const games = readGames();
  const game = games.find((g: any) => g.id === id);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  game.views = (game.views || 0) + 1;
  writeGames(games);

  res.json({ success: true, views: game.views });
});

// 5. Get Announcement
app.get('/api/announcements', (req: Request, res: Response) => {
  const ann = readAnnouncements();
  res.json(ann);
});

// 6. Update Announcement
app.post('/api/announcements', (req: Request, res: Response) => {
  const { title, content } = req.body;
  const ann = readAnnouncements();
  
  if (ann.length > 0) {
    ann[0].title = title || ann[0].title;
    ann[0].content = content || ann[0].content;
    ann[0].date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else {
    ann.push({
      id: `ann-${Date.now()}`,
      title: title || '📢 Latest Announcements',
      content: content || '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  }

  writeAnnouncements(ann);
  res.json(ann[0]);
});

// 7. Submit Feedback
app.post('/api/feedback', (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const feedback = readFeedback();
  const newFeedback = {
    id: `fb-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    date: new Date().toISOString()
  };

  feedback.unshift(newFeedback);
  writeFeedback(feedback);

  res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
});

// Setup Vite Dev Middleware / Static File Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Official.Ramansh Indie server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
