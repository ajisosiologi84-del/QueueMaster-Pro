import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Simple In-Memory Database ---
  let queues: any[] = [];
  let schools: any[] = [
    { id: '1', nama: 'UPT SMP NEGERI 1 PASURUAN' },
    { id: '2', nama: 'UPT SMP NEGERI 2 PASURUAN' },
    { id: '3', nama: 'UPT SMP NEGERI 3 PASURUAN' },
    { id: '4', nama: 'UPT SMP NEGERI 4 PASURUAN' },
    { id: '5', nama: 'UPT SMP NEGERI 5 PASURUAN' },
    { id: '6', nama: 'UPT SMP NEGERI 6 PASURUAN' },
    { id: '7', nama: 'UPT SMP NEGERI 7 PASURUAN' },
    { id: '8', nama: 'UPT SMP NEGERI 8 PASURUAN' },
    { id: '9', nama: 'UPT SMP NEGERI 9 PASURUAN' },
    { id: '10', nama: 'UPT SMP NEGERI 10 PASURUAN' },
    { id: '11', nama: 'UPT SMP NEGERI 11 PASURUAN' },
    { id: '12', nama: 'SMPS ISLAM DARUL KAROMAH' },
    { id: '13', nama: 'SMPS DARUL ULUM' },
    { id: '14', nama: 'SMPP AL AZHAR' },
    { id: '15', nama: 'SMP TRIBAHASA HARAPAN BANGSA' },
    { id: '16', nama: 'SMP S-PEAM' },
    { id: '17', nama: 'SMP SABILUTH THOYYIB' },
    { id: '18', nama: 'SMP MUHAMMADIYAH I' },
    { id: '19', nama: 'SMP MAARIF I' },
    { id: '20', nama: 'SMP KRISTEN ELKANA' },
    { id: '21', nama: 'SMP K SANG TIMUR' },
    { id: '22', nama: 'SMP ISLAM TARBIYATUS SALAFIYAH' },
    { id: '23', nama: 'SMP ISLAM ROUDHOTUL HASANAH' },
    { id: '24', nama: 'SMP ISLAM PASURUAN' },
    { id: '25', nama: 'SMP BAYT AL HIKMAH' },
    { id: '26', nama: 'SMP BAHTERA INDONESIA' },
    { id: '27', nama: 'SMP A. WAHID HASYIM' },
    { id: '28', nama: 'SMP 1949' },
  ];
  let config = {
    servingIndex: -1,
    appTitle: "Antrean PPDB 2024",
    appSubtitle: "Loket Layanan Informasi & Pendaftaran",
    logoUrl: "",
    barcodeUrl: ""
  };

  // --- API Routes ---

  // Get all data
  app.get("/api/initial-data", (req, res) => {
    res.json({ queues, schools, config });
  });

  // Add to queue
  app.post("/api/queues", (req, res) => {
    const newQueue = {
      ...req.body,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'waiting',
      participantStatus: 'menunggu'
    };
    queues.push(newQueue);
    res.status(201).json(newQueue);
  });

  // Update config (serving index, etc)
  app.post("/api/config", (req, res) => {
    config = { ...config, ...req.body };
    res.json(config);
  });

  // Update a queue item
  app.patch("/api/queues/:id", (req, res) => {
    const { id } = req.params;
    const index = queues.findIndex(q => q.id === id);
    if (index !== -1) {
      queues[index] = { ...queues[index], ...req.body };
      res.json(queues[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Delete a queue item
  app.delete("/api/queues/:id", (req, res) => {
    const { id } = req.params;
    queues = queues.filter(q => q.id !== id);
    res.json({ success: true });
  });

  // Add a school
  app.post("/api/schools", (req, res) => {
    const newSchool = { ...req.body, id: Date.now().toString() };
    schools.push(newSchool);
    res.status(201).json(newSchool);
  });

  // Bulk reset
  app.post("/api/reset", (req, res) => {
    queues = [];
    config.servingIndex = -1;
    res.json({ success: true, queues, config });
  });

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
