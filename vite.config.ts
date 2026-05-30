import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/chat'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables (e.g. OPENAI_API_KEY) from .env.local into process.env
  const env = loadEnv(mode, process.cwd(), '');
  process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'api-chat-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/chat' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                let parsedBody = {};
                try {
                  if (body) {
                    parsedBody = JSON.parse(body);
                  }
                } catch (e) {
                  console.error('Failed to parse request body:', e);
                }

                // Create VercelRequest and VercelResponse adapter
                const originalEnd = res.end.bind(res);
                const vercelReq = Object.assign(req, { body: parsedBody });
                const vercelRes = Object.assign(res, {
                  status(code: number) {
                    res.statusCode = code;
                    return this;
                  },
                  json(data: any) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return this;
                  },
                  end(data?: any) {
                    originalEnd(data);
                    return this;
                  }
                });

                try {
                  await handler(vercelReq, vercelRes);
                } catch (err: any) {
                  console.error('Error in local API handler:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Local Dev server error', message: err.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
  }
})
