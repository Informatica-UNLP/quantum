require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'lotes.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const JSPDF_FILE = path.join(__dirname, 'node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js');

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function isValidLote(body) {
  if (!body || typeof body !== 'object') return false;
  if (!Array.isArray(body.procs) || body.procs.length === 0 || body.procs.length > 50) return false;
  for (const p of body.procs) {
    if (!Array.isArray(p) || p.length !== 4) return false;
    const [arrival, cpu, prio, io] = p;
    if (typeof arrival !== 'number' || typeof cpu !== 'number' || typeof prio !== 'number') return false;
    if (typeof io !== 'string' || io.length > 500) return false;
  }
  if (typeof body.algo !== 'string' || body.algo.length > 30) return false;
  if (typeof body.quantum !== 'number') return false;
  if (typeof body.aging !== 'number') return false;
  return true;
}

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(PUBLIC_DIR));
app.get('/vendor/jspdf.umd.min.js', (req, res) => res.sendFile(JSPDF_FILE));

// El Client ID de Google se configura en el servidor (variable de entorno
// GOOGLE_CLIENT_ID) y el frontend lo pide acá. Así nadie tiene que pegarlo
// a mano en el navegador, y no queda hardcodeado en el código fuente.
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

app.post('/api/share', (req, res) => {
  if (!isValidLote(req.body)) {
    return res.status(400).json({ error: 'El lote no tiene el formato esperado.' });
  }
  const store = readStore();
  let code;
  do { code = nanoid(7); } while (store[code]);
  store[code] = { ...req.body, createdAt: new Date().toISOString() };
  writeStore(store);
  res.json({ code });
});

app.get('/api/share/:code', (req, res) => {
  const store = readStore();
  const lote = store[req.params.code];
  if (!lote) return res.status(404).json({ error: 'No existe un lote con ese código.' });
  res.json(lote);
});

app.listen(PORT, () => {
  console.log('Simulador de planificación escuchando en http://localhost:' + PORT);
});
