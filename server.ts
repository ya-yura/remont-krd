import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  validateLeadForm,
  formatPhoneDisplay,
  type LeadRecord,
  type FunnelStage,
} from './src/utils/renovationLogic.ts';
import { DEFAULT_PROCESS_PHOTOS, type WorkProcessPhotoItem } from './src/data/landingData.ts';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const PROCESS_PHOTOS_FILE = path.join(DATA_DIR, 'process-photos.json');
const PUBLIC_ASSETS_DIR = path.join(__dirname, 'public', 'assets');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PUBLIC_ASSETS_DIR)) {
    fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADS_FILE)) {
    const initialLeads: LeadRecord[] = [
      {
        id: 'DEMO-01',
        createdAt: new Date().toLocaleDateString('ru-RU'),
        name: '[Пример заявки] Сергей',
        phone: '+7 (918) 000-00-00',
        preferredChannel: 'telegram',
        objectType: 'Новостройка — нужен отдельный этап (электрика / сантехника / штукатурка)',
        district: 'Прикубанский округ (Губернский, Панорама, Восточно-Кругликовский)',
        startTimeline: 'По договорённости',
        comment: 'Нужен осмотр квартиры и расчёт чернового этапа по факту.',
        photosCount: 1,
        photoNames: ['plan_kvartiry.pdf'],
        funnelStage: 'site_inspection',
      },
    ];
    fs.writeFileSync(LEADS_FILE, JSON.stringify(initialLeads, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ANALYTICS_FILE)) {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(PROCESS_PHOTOS_FILE)) {
    fs.writeFileSync(
      PROCESS_PHOTOS_FILE,
      JSON.stringify(DEFAULT_PROCESS_PHOTOS, null, 2),
      'utf-8'
    );
  }
}

function readLeads(): LeadRecord[] {
  try {
    ensureDataFiles();
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLeads(leads: LeadRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

function readProcessPhotos(): WorkProcessPhotoItem[] {
  try {
    ensureDataFiles();
    const raw = fs.readFileSync(PROCESS_PHOTOS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROCESS_PHOTOS;
  }
}

function saveProcessPhotos(photos: WorkProcessPhotoItem[]): WorkProcessPhotoItem[] {
  ensureDataFiles();
  const processed = photos.map((item, idx) => {
    if (item.imageUrl && item.imageUrl.startsWith('data:image/')) {
      const match = item.imageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1].replace(/[^a-z0-9]/gi, '');
        const buffer = Buffer.from(match[2], 'base64');
        const fileName = `process-user-${idx + 1}.${ext}`;
        const filePath = path.join(PUBLIC_ASSETS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        return {
          ...item,
          imageUrl: `./assets/${fileName}?t=${Date.now()}`,
        };
      }
    }
    return item;
  });

  fs.writeFileSync(PROCESS_PHOTOS_FILE, JSON.stringify(processed, null, 2), 'utf-8');
  return processed;
}

const ipSubmissionMap = new Map<string, number>();

async function startServer() {
  ensureDataFiles();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/leads', (_req, res) => {
    res.json({ leads: readLeads() });
  });

  app.post('/api/leads', (req, res) => {
    const clientIp = req.ip || 'local';
    const lastSubmit = ipSubmissionMap.get(clientIp) || 0;
    const now = Date.now();
    if (now - lastSubmit < 1500) {
      res.status(429).json({ error: 'Пожалуйста, подождите пару секунд перед повторной отправкой.' });
      return;
    }

    const body = req.body || {};
    const validation = validateLeadForm({
      name: body.name || '',
      phone: body.phone || '',
      preferredChannel: body.preferredChannel || 'phone',
      objectType: body.objectType || '',
      district: body.district || '',
      startTimeline: body.startTimeline || '',
      comment: body.comment || '',
      photosCount: Number(body.photosCount) || 0,
      photoNames: Array.isArray(body.photoNames) ? body.photoNames : [],
      consentAccepted: Boolean(body.consentAccepted),
      honeypot: body.honeypot || '',
    });

    if (!validation.valid) {
      res.status(400).json({ error: 'Ошибка проверки полей формы', errors: validation.errors });
      return;
    }

    ipSubmissionMap.set(clientIp, now);

    const leads = readLeads();
    const newLead: LeadRecord = {
      id: `RPK-${100 + leads.length + 1}`,
      createdAt: new Date().toLocaleDateString('ru-RU'),
      name: String(body.name).trim(),
      phone: formatPhoneDisplay(String(body.phone)),
      preferredChannel:
        body.preferredChannel === 'telegram' || body.preferredChannel === 'whatsapp'
          ? body.preferredChannel
          : 'phone',
      objectType: String(body.objectType || 'Не указано'),
      district: String(body.district || 'Не указан'),
      startTimeline: String(body.startTimeline || 'По договорённости'),
      comment: String(body.comment || '').trim(),
      photosCount: Number(body.photosCount) || 0,
      photoNames: Array.isArray(body.photoNames) ? body.photoNames.map(String) : [],
      funnelStage: 'inquiry',
    };

    leads.unshift(newLead);
    writeLeads(leads);

    res.status(201).json({ lead: newLead });
  });

  app.patch('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const { funnelStage } = req.body || {};
    const leads = readLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Заявка не найдена' });
      return;
    }
    leads[index].funnelStage = funnelStage as FunnelStage;
    writeLeads(leads);
    res.json({ lead: leads[index] });
  });

  app.get('/api/process-photos', (_req, res) => {
    res.json({ photos: readProcessPhotos() });
  });

  app.post('/api/process-photos', (req, res) => {
    const photos = req.body?.photos;
    if (!Array.isArray(photos)) {
      res.status(400).json({ error: 'Ожидается массив фотографий' });
      return;
    }
    const saved = saveProcessPhotos(photos);
    res.json({ photos: saved });
  });

  app.post('/api/deploy-github', async (req, res) => {
    const { repo = 'ya-yura/remont-pod-kontrolem', branch = 'main', token = '' } = req.body || {};
    if (!token || typeof token !== 'string' || !token.trim()) {
      res.status(400).json({ error: 'Укажите GitHub Personal Access Token.' });
      return;
    }
    const cleanRepo = String(repo).replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').trim();
    const remoteUrl = `https://x-access-token:${token.trim()}@github.com/${cleanRepo}.git`;

    try {
      await execFileAsync('npm', ['run', 'build'], { cwd: __dirname });
      if (!fs.existsSync(path.join(__dirname, '.git'))) {
        await execFileAsync('git', ['init'], { cwd: __dirname });
      }
      await execFileAsync('git', ['config', 'user.name', 'Yuri Pilov'], { cwd: __dirname });
      await execFileAsync('git', ['config', 'user.email', 'upylev@cleverence.ru'], { cwd: __dirname });
      await execFileAsync('git', ['branch', '-M', branch], { cwd: __dirname });
      await execFileAsync('git', ['add', '-A'], { cwd: __dirname });
      try {
        await execFileAsync(
          'git',
          ['commit', '-m', 'feat: simplify landing page, add work process photos, remove price estimates'],
          { cwd: __dirname }
        );
      } catch {
        // Nothing new to commit
      }
      await execFileAsync('git', ['push', '--force', remoteUrl, `HEAD:${branch}`], { cwd: __dirname });
      res.json({
        ok: true,
        message: `Успешно отправлено в https://github.com/${cleanRepo} (ветка ${branch}). GitHub Actions автоматически обновит https://ya-yura.github.io/remont-pod-kontrolem/`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка выполнения git push';
      res.status(500).json({
        ok: false,
        error: msg.replace(/x-access-token:[^@]+@/g, 'x-access-token:***@'),
      });
    }
  });

  app.post('/api/analytics', (req, res) => {
    try {
      ensureDataFiles();
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      const events = JSON.parse(raw);
      events.unshift({
        eventName: String(req.body?.eventName || 'unknown'),
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        meta: req.body?.meta || {},
      });
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(events.slice(0, 100), null, 2), 'utf-8');
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
