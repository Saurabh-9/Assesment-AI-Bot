const express = require('express');
const axios = require('axios');

module.exports = () => {
  const router = express.Router();

  // POST /api/tts
  // body: { text: string, voice?: 'male'|'female', languageCode?: string }
  router.post('/', async (req, res) => {
    try {
      const { text, voice = 'male', languageCode = 'en-US' } = req.body || {};
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'text is required' });
      }

      const GOOGLE_TTS_KEY = process.env.GOOGLE_TTS_API_KEY;
      if (!GOOGLE_TTS_KEY) {
        return res.status(501).json({ error: 'TTS not configured' });
      }

      // pick a safe default voice name per language
      const genderMap = voice === 'female' ? 'F' : 'B';
      const voiceName = `${languageCode}-Standard-${genderMap}`;

      const payload = {
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      };

      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`;
      const { data } = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });

      const audioContent = data.audioContent;
      if (!audioContent) {
        return res.status(502).json({ error: 'No audio returned from TTS' });
      }

      const buffer = Buffer.from(audioContent, 'base64');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (err) {
      const detail = err?.response?.data || err.message || 'unknown error';
      console.error('TTS error:', detail);
      // expose limited detail in dev to help diagnose
      const body = process.env.NODE_ENV === 'development'
        ? { error: 'TTS failed', detail }
        : { error: 'TTS failed' };
      return res.status(500).json(body);
    }
  });

  return router;
};
