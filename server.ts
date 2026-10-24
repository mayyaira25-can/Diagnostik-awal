import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Submission {
  id: string;
  nama: string;
  kelas: string;
  nis?: string;
  ans: number[]; // e.g. [0, 1, 1, 0, 0, 1, 1]
  kesiapan: string; // e.g. "siap", "cukup siap", "perlu dibantu"
  skor: number;
  tot: number;
  level: 'Siap Tantangan' | 'Cukup Siap' | 'Perlu Pendampingan';
  per: Record<string, { b: number; n: number }>;
  lemah: string[];
  submittedAt: string;
}

// Initial seed data if file doesn't exist so teacher dashboard can immediately preview real chemistry scenarios
const INITIAL_DEMO_DATA: Submission[] = [
  {
    id: "sub_1",
    nama: "Ahmad Fauzi",
    kelas: "XI MIPA 1",
    ans: [0, 1, 1, 0, 0, 1, 1],
    kesiapan: "siap",
    skor: 6,
    tot: 6,
    level: "Siap Tantangan",
    per: { mol: { b: 1, n: 1 }, molaritas: { b: 1, n: 1 }, grafik: { b: 2, n: 2 }, luas: { b: 2, n: 2 } },
    lemah: [],
    submittedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "sub_2",
    nama: "Nadia Safitri",
    kelas: "XI MIPA 1",
    ans: [1, 1, 1, 0, 0, 1, 1],
    kesiapan: "cukup siap",
    skor: 6,
    tot: 6,
    level: "Siap Tantangan",
    per: { mol: { b: 1, n: 1 }, molaritas: { b: 1, n: 1 }, grafik: { b: 2, n: 2 }, luas: { b: 2, n: 2 } },
    lemah: [],
    submittedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString()
  },
  {
    id: "sub_3",
    nama: "Budi Santoso",
    kelas: "XI MIPA 1",
    ans: [1, 3, 1, 0, 1, 1, 1],
    kesiapan: "cukup siap",
    skor: 4,
    tot: 6,
    level: "Cukup Siap",
    per: { mol: { b: 0, n: 1 }, molaritas: { b: 1, n: 1 }, grafik: { b: 1, n: 2 }, luas: { b: 2, n: 2 } },
    lemah: ["mol", "grafik"],
    submittedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: "sub_4",
    nama: "Citra Dewi",
    kelas: "XI MIPA 1",
    ans: [2, 0, 0, 0, 1, 1, 0],
    kesiapan: "perlu dibantu",
    skor: 2,
    tot: 6,
    level: "Perlu Pendampingan",
    per: { mol: { b: 0, n: 1 }, molaritas: { b: 0, n: 1 }, grafik: { b: 1, n: 2 }, luas: { b: 1, n: 2 } },
    lemah: ["mol", "molaritas", "grafik", "luas"],
    submittedAt: new Date(Date.now() - 1000 * 60 * 7).toISOString()
  },
  {
    id: "sub_5",
    nama: "Dimas Pratama",
    kelas: "XI MIPA 2",
    ans: [1, 1, 0, 0, 0, 1, 1],
    kesiapan: "cukup siap",
    skor: 5,
    tot: 6,
    level: "Cukup Siap", // molaritas salah jadi belum siap tantangan
    per: { mol: { b: 1, n: 1 }, molaritas: { b: 0, n: 1 }, grafik: { b: 2, n: 2 }, luas: { b: 2, n: 2 } },
    lemah: ["molaritas"],
    submittedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: "sub_6",
    nama: "Eka Putri",
    kelas: "XI MIPA 2",
    ans: [2, 3, 3, 3, 1, 0, 0],
    kesiapan: "perlu dibantu",
    skor: 0,
    tot: 6,
    level: "Perlu Pendampingan",
    per: { mol: { b: 0, n: 1 }, molaritas: { b: 0, n: 1 }, grafik: { b: 0, n: 2 }, luas: { b: 0, n: 2 } },
    lemah: ["mol", "molaritas", "grafik", "luas"],
    submittedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

// Helper to load submissions
function loadSubmissions(): Submission[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading submissions file:', err);
  }
  // If not exist, write initial data
  saveSubmissions(INITIAL_DEMO_DATA);
  return INITIAL_DEMO_DATA;
}

function saveSubmissions(data: Submission[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing submissions file:', err);
  }
}

let submissions: Submission[] = loadSubmissions();

// SSE clients list
type SSEClient = {
  id: number;
  res: Response;
};
let sseClients: SSEClient[] = [];

function broadcastToClients(event: string, payload: any) {
  const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(dataString);
    } catch (err) {
      // client dropped
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // SSE endpoint for live updates
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = Date.now() + Math.random();
    sseClients.push({ id: clientId, res });

    // Send initial snapshot
    res.write(`event: init\ndata: ${JSON.stringify(submissions)}\n\n`);

    req.on('close', () => {
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

  // Get all submissions
  app.get('/api/submissions', (req: Request, res: Response) => {
    const { kelas } = req.query;
    if (kelas && typeof kelas === 'string' && kelas !== 'Semua') {
      const filtered = submissions.filter((s) => s.kelas === kelas);
      return res.json({ success: true, count: filtered.length, data: filtered });
    }
    return res.json({ success: true, count: submissions.length, data: submissions });
  });

  // Post student submission
  app.post('/api/submissions', (req: Request, res: Response) => {
    try {
      const { nama, kelas, ans, nis } = req.body;
      if (!nama || !kelas || !Array.isArray(ans) || ans.length !== 7) {
        return res.status(400).json({ success: false, error: 'Data formulir tidak lengkap atau format salah.' });
      }

      // Question definitions & calculation
      const Q_INFO = [
        { key: 'kesiapan', isInfo: true },
        { key: 'mol', correct: 1 },
        { key: 'molaritas', correct: 1 },
        { key: 'grafik', correct: 0 },
        { key: 'grafik', correct: 0 },
        { key: 'luas', correct: 1 },
        { key: 'luas', correct: 1 }
      ];

      const per: Record<string, { b: number; n: number }> = {
        mol: { b: 0, n: 1 },
        molaritas: { b: 0, n: 1 },
        grafik: { b: 0, n: 2 },
        luas: { b: 0, n: 2 }
      };

      let skor = 0;
      const tot = 6;

      Q_INFO.forEach((q, idx) => {
        if (q.isInfo) return;
        const answer = ans[idx];
        if (answer === q.correct) {
          per[q.key].b++;
          skor++;
        }
      });

      const lemah = Object.keys(per).filter((k) => per[k].b < per[k].n);

      // Level determination:
      // Siap Tantangan: skor >= 5 and fundamental calculations (mol and molaritas) both fully correct
      // Cukup Siap: skor >= 3
      // Perlu Pendampingan: skor < 3
      let level: 'Siap Tantangan' | 'Cukup Siap' | 'Perlu Pendampingan' = 'Perlu Pendampingan';
      if (skor >= 5 && per.mol.b === 1 && per.molaritas.b === 1) {
        level = 'Siap Tantangan';
      } else if (skor >= 3) {
        level = 'Cukup Siap';
      }

      const kesiapanOptions = ['siap', 'cukup siap', 'perlu dibantu'];
      const kesiapan = kesiapanOptions[ans[0]] || 'cukup siap';

      const newSubmission: Submission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nama: String(nama).trim(),
        kelas: String(kelas).trim(),
        nis: nis ? String(nis).trim() : undefined,
        ans,
        kesiapan,
        skor,
        tot,
        level,
        per,
        lemah,
        submittedAt: new Date().toISOString()
      };

      // Add to front of array
      submissions.unshift(newSubmission);
      saveSubmissions(submissions);

      // Broadcast new submission to all active teacher clients
      broadcastToClients('new_submission', newSubmission);
      broadcastToClients('update_all', submissions);

      return res.status(201).json({
        success: true,
        data: newSubmission
      });
    } catch (err: any) {
      console.error('Error submitting diagnostic:', err);
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  // Delete submission
  app.delete('/api/submissions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    submissions = submissions.filter((s) => s.id !== id);
    saveSubmissions(submissions);
    broadcastToClients('update_all', submissions);
    return res.json({ success: true, message: 'Data siswa berhasil dihapus' });
  });

  // Reset or clear submissions
  app.post('/api/reset', (req: Request, res: Response) => {
    const { kelas } = req.body;
    if (kelas && kelas !== 'Semua') {
      submissions = submissions.filter((s) => s.kelas !== kelas);
    } else {
      submissions = [];
    }
    saveSubmissions(submissions);
    broadcastToClients('update_all', submissions);
    return res.json({ success: true, message: 'Data berhasil direset' });
  });

  // Restore demo submissions
  app.post('/api/seed', (req: Request, res: Response) => {
    submissions = [...INITIAL_DEMO_DATA];
    saveSubmissions(submissions);
    broadcastToClients('update_all', submissions);
    return res.json({ success: true, count: submissions.length, data: submissions });
  });

  // Aggregated stats endpoint
  app.get('/api/stats', (req: Request, res: Response) => {
    const { kelas } = req.query;
    const currentList =
      kelas && typeof kelas === 'string' && kelas !== 'Semua'
        ? submissions.filter((s) => s.kelas === kelas)
        : submissions;

    const total = currentList.length;
    const avgScore = total > 0 ? (currentList.reduce((acc, s) => acc + s.skor, 0) / total).toFixed(1) : 0;

    const readinessCounts = {
      siapTantangan: currentList.filter((s) => s.level === 'Siap Tantangan').length,
      cukupSiap: currentList.filter((s) => s.level === 'Cukup Siap').length,
      perluPendampingan: currentList.filter((s) => s.level === 'Perlu Pendampingan').length
    };

    const prerequisiteStats = {
      mol: { correctRate: 0, needsSupport: 0 },
      molaritas: { correctRate: 0, needsSupport: 0 },
      grafik: { correctRate: 0, needsSupport: 0 },
      luas: { correctRate: 0, needsSupport: 0 }
    };

    if (total > 0) {
      let molB = 0, molN = 0;
      let molaritasB = 0, molaritasN = 0;
      let grafikB = 0, grafikN = 0;
      let luasB = 0, luasN = 0;

      currentList.forEach((s) => {
        molB += s.per.mol?.b || 0;
        molN += s.per.mol?.n || 1;

        molaritasB += s.per.molaritas?.b || 0;
        molaritasN += s.per.molaritas?.n || 1;

        grafikB += s.per.grafik?.b || 0;
        grafikN += s.per.grafik?.n || 2;

        luasB += s.per.luas?.b || 0;
        luasN += s.per.luas?.n || 2;
      });

      prerequisiteStats.mol = {
        correctRate: Math.round((molB / molN) * 100),
        needsSupport: currentList.filter((s) => s.lemah.includes('mol')).length
      };
      prerequisiteStats.molaritas = {
        correctRate: Math.round((molaritasB / molaritasN) * 100),
        needsSupport: currentList.filter((s) => s.lemah.includes('molaritas')).length
      };
      prerequisiteStats.grafik = {
        correctRate: Math.round((grafikB / grafikN) * 100),
        needsSupport: currentList.filter((s) => s.lemah.includes('grafik')).length
      };
      prerequisiteStats.luas = {
        correctRate: Math.round((luasB / luasN) * 100),
        needsSupport: currentList.filter((s) => s.lemah.includes('luas')).length
      };
    }

    const selfReadiness = {
      siap: currentList.filter((s) => s.kesiapan === 'siap').length,
      cukupSiap: currentList.filter((s) => s.kesiapan === 'cukup siap').length,
      perluDibantu: currentList.filter((s) => s.kesiapan === 'perlu dibantu').length
    };

    return res.json({
      total,
      avgScore,
      readinessCounts,
      prerequisiteStats,
      selfReadiness
    });
  });

  // Vite integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cek Bekal Kimia] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
