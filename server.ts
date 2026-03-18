import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { DebateOrchestrator, SCIENTISTS_PRESET } from './src/services/debateEngine';
import dotenv from 'dotenv';

import { listAgents } from './src/services/gradientService';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  const hasToken = (process.env.DIGITALOCEAN_TOKEN && process.env.DIGITALOCEAN_TOKEN !== 'MY_DIGITALOCEAN_TOKEN');
  
  if (!hasToken) {
    console.warn('⚠️  DIGITALOCEAN_TOKEN is not set. The app will run in simulation mode with mock responses.');
  } else {
    console.log('✅ DigitalOcean API credentials detected. Gradient AI features enabled.');
  }

  let activeDebate: DebateOrchestrator | null = null;

  // API Routes
  app.get('/api/agents/list', async (req, res) => {
    try {
      const agents = await listAgents();
      res.json({ agents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/debate/start', (req, res) => {
    const { topic, presetId } = req.body;
    // For now, we only have the scientists preset
    const preset = SCIENTISTS_PRESET; 
    activeDebate = new DebateOrchestrator(topic, preset);
    res.json(activeDebate.getState());
  });

  app.post('/api/debate/next', async (req, res) => {
    if (!activeDebate) {
      return res.status(400).json({ error: 'No active debate' });
    }
    try {
      const state = await activeDebate.runNextRound();
      res.json(state);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/debate/state', (req, res) => {
    if (!activeDebate) {
      return res.status(404).json({ error: 'No active debate' });
    }
    res.json(activeDebate.getState());
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
