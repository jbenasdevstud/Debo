import http from 'node:http';

const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-6-luna';
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;
const requestsByIp = new Map();

const schema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          estimatedGrams: { type: 'number' },
          carbohydratesG: { type: 'number' },
          proteinG: { type: 'number' },
          fatG: { type: 'number' },
          glycemicIndex: { type: ['integer', 'null'] },
          glycemicIndexNote: { type: 'string' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          uncertainty: { type: 'string' }
        },
        required: ['name', 'estimatedGrams', 'carbohydratesG', 'proteinG', 'fatG', 'glycemicIndex', 'glycemicIndexNote', 'confidence', 'uncertainty'],
        additionalProperties: false
      }
    },
    overallNote: { type: 'string' }
  },
  required: ['items', 'overallNote'],
  additionalProperties: false
};

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function validateResult(value) {
  if (!value || !Array.isArray(value.items) || value.items.length > 12 || typeof value.overallNote !== 'string') return false;
  return value.items.every(item => item && typeof item.name === 'string' &&
    ['estimatedGrams', 'carbohydratesG', 'proteinG', 'fatG'].every(k => Number.isFinite(item[k]) && item[k] >= 0 && item[k] <= 10000) &&
    (item.glycemicIndex === null || (Number.isInteger(item.glycemicIndex) && item.glycemicIndex >= 0 && item.glycemicIndex <= 100)) &&
    ['low', 'medium', 'high'].includes(item.confidence) && typeof item.glycemicIndexNote === 'string' && typeof item.uncertainty === 'string');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }
  if (req.method !== 'POST' || req.url !== '/api/analyze-meal') return send(res, 404, { error: 'Not found' });
  const now = Date.now();
  const ip = req.socket.remoteAddress || 'unknown';
  const recent = (requestsByIp.get(ip) || []).filter(ts => now - ts < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return send(res, 429, { error: 'Per daug užklausų. Bandykite vėliau.' });
  recent.push(now);
  requestsByIp.set(ip, recent);

  if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'Serveryje nenustatytas OPENAI_API_KEY.' });
  let payload;
  try { payload = await readJson(req); }
  catch (error) { return send(res, error.status || 400, { error: error.message }); }
  const match = typeof payload?.imageDataUrl === 'string' && payload.imageDataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || Buffer.from(match[2], 'base64').length > 5 * 1024 * 1024) return send(res, 400, { error: 'Pateikite JPG, PNG arba WebP nuotrauką iki 5 MB.' });

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        instructions: 'Estimate the visible foods and portion sizes from this image. Return only estimates, never medical advice, glucose interpretation, insulin dose, correction, or dose adjustment. Macronutrients must be totals for the estimated visible portion and are approximate. If food identity, hidden ingredients, or portion size is unclear, state uncertainty and lower confidence. Glycemic index is not visually measurable: return null unless the food can be identified specifically enough to provide a typical published food-level estimate; always state that it depends on variety, ripeness and preparation. Do not imply GI is measured from the image. Use the requested language for food names and notes.',
        input: [{ role: 'user', content: [
          { type: 'input_text', text: `Analyze this meal photo. Respond in ${{ lt: 'Lithuanian', en: 'English', lv: 'Latvian', pl: 'Polish', de: 'German' }[payload.language] || 'English'}. Give separate visible components where practical. Estimate edible portion grams, total carbohydrates, protein and fat for each component.` },
          { type: 'input_image', image_url: payload.imageDataUrl, detail: 'high' }
        ] }],
        text: { format: { type: 'json_schema', name: 'meal_photo_estimate', strict: true, schema } }
      })
    });
    const apiResult = await response.json();
    if (!response.ok) {
      console.error('OpenAI request failed:', response.status, apiResult.error?.code || 'unknown');
      return send(res, 502, { error: 'Maisto analizė nepavyko. Pabandykite dar kartą.' });
    }
    const outputText = apiResult.output?.flatMap(x => x.content || []).find(x => x.type === 'output_text')?.text;
    const result = outputText && JSON.parse(outputText);
    if (!validateResult(result)) return send(res, 502, { error: 'Gautas netinkamas analizės formatas.' });
    return send(res, 200, { ...result, estimated: true, requiresConfirmation: true });
  } catch (error) {
    console.error('Meal analysis error:', error.message);
    return send(res, 502, { error: 'Nepavyko prisijungti prie analizės paslaugos.' });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Debo meal analysis API listening on port ${PORT}`));
