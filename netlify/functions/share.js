const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function newCode() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 7);
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

exports.handler = async (event) => {
  const json = (statusCode, obj) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });

  const store = getStore('lotes');

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'JSON inválido.' }); }
    if (!isValidLote(body)) return json(400, { error: 'El lote no tiene el formato esperado.' });

    let code;
    let attempts = 0;
    do {
      code = newCode();
      attempts++;
    } while ((await store.get(code)) !== null && attempts < 5);

    await store.setJSON(code, { ...body, createdAt: new Date().toISOString() });
    return json(200, { code });
  }

  if (event.httpMethod === 'GET') {
    const code = event.queryStringParameters && event.queryStringParameters.code;
    if (!code) return json(400, { error: 'Falta el código.' });
    const lote = await store.get(code, { type: 'json' });
    if (!lote) return json(404, { error: 'No existe un lote con ese código.' });
    return json(200, lote);
  }

  return json(405, { error: 'Método no permitido.' });
};
