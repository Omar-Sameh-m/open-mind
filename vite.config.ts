import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        try {
          if (pathname === '/api/health') {
            const mod = await server.ssrLoadModule('/api/health.ts');
            return await mod.default(req, res);
          }
          if (pathname === '/api/analyze') {
            const mod = await server.ssrLoadModule('/api/analyze.ts');
            return await mod.default(req, res);
          }
          if (pathname === '/api/transcribe') {
            const mod = await server.ssrLoadModule('/api/transcribe.ts');
            return await mod.default(req, res);
          }
        } catch (err: any) {
          console.error(`Error handling ${pathname}:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
