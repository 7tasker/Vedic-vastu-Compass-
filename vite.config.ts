import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function expressApiDevPlugin(): Plugin {
  return {
    name: 'express-api-dev-plugin',
    configureServer(server) {
      server.middlewares.use('/api/vastu-consultant', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { userQuestion, houseScore, houseFacingDirection, propertyType, placedRooms } = parsed;

            if (!userQuestion) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Please provide your Vastu question.' }));
              return;
            }

            const ai = new GoogleGenAI({
              apiKey: process.env.GEMINI_API_KEY,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            const roomsSummary = placedRooms && Array.isArray(placedRooms) && placedRooms.length > 0
              ? placedRooms.map((r: { roomType: string; degree: number }) => `- Room: ${r.roomType} at ${Math.round(r.degree)}°`).join('\n')
              : 'No specific room list provided.';

            const systemPrompt = `You are Vastu Guru Shastry, an elite expert in Hindu Vastu Shastra, Vedic Architecture (Sthapatya Veda), and Mayamatam / Mansara scriptures.
Your mission is to provide deeply authentic, empathetic, and practical Vastu Shastra advice for Hindu homes.

RULES FOR YOUR RESPONSES:
1. Always base advice on traditional Hindu Vastu Shastra principles, Pancha Mahabhutas (5 Elements), 16 Vastu Zones, and 8 Ashta Dikpalas.
2. Emphasize NON-DESTRUCTIVE REMEDIES (e.g. Color therapy, Vastu Pyramids, Swastika/Om/Trishul symbols, Yantras, Plants like Tulsi, Raw Sea Salt, Camphor, Metallic Strips, Light bulbs, Water fountains) so users don't need to demolish walls.
3. Keep the tone warm, spiritually soothing, encouraging, professional, and clear.
4. Structure your response into clear, formatted markdown with headings:
   - 🕉️ **Vastu Analysis & Elemental Impact**
   - 🛠️ **Specific Non-Destructive Remedial Steps**
   - 🌺 **Sacred Hindu Practices & Mantras** (e.g., Vastu Purusha Mantra, Kuber Mantra, Gayatri Mantra)
   - 💡 **Practical Daily Tips**`;

            const userPromptText = `User Query: "${userQuestion}"

Property Context:
- Property Type: ${propertyType || 'Residential Home'}
- House Facing Direction: ${houseFacingDirection || 'Not specified'}
- Current Vastu Score: ${houseScore !== undefined ? `${houseScore}%` : 'Not computed'}

Current Placed Rooms:
${roomsSummary}`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: userPromptText,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
              },
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ answer: response.text }));
          } catch (err: unknown) {
            console.error('Dev API Error:', err);
            const msg = err instanceof Error ? err.message : 'Internal Server Error';
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: msg }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
