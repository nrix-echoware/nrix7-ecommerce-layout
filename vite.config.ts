import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from "vite";
import type http from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    configure: (server: any) => {
      server.middlewares.use((req: Connect.IncomingMessage, res: http.ServerResponse, next: Connect.NextFunction) => {
        const url = req.url || '';
        
        if (url.startsWith('/orders') && !url.startsWith('/orders/')) {
          const hasQuery = url.includes('?');
          if (hasQuery) {
            const httpModule = require('http');
            const proxyReq = httpModule.request({
              hostname: 'localhost',
              port: 8080,
              path: url,
              method: req.method,
              headers: req.headers,
            }, (proxyRes: http.IncomingMessage) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            });
            req.pipe(proxyReq);
            proxyReq.on('error', () => next());
            return;
          }
        }
        
        if (url.startsWith('/orders/') && url !== '/orders/') {
          const hasStatus = url.includes('/status');
          const isPostPutDelete = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '');
          const hasAuthHeader = req.headers['authorization'] || req.headers['x-admin-api-key'] || req.headers['X-Admin-API-Key'];
          const isUUID = /^\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/.test(url);
          
          if (hasStatus || isPostPutDelete || (isUUID && hasAuthHeader)) {
            const httpModule = require('http');
            const proxyReq = httpModule.request({
              hostname: 'localhost',
              port: 8080,
              path: url,
              method: req.method,
              headers: req.headers,
            }, (proxyRes: http.IncomingMessage) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            });
            req.pipe(proxyReq);
            proxyReq.on('error', () => next());
            return;
          }
        }
        
        if (url.startsWith('/admin/orders')) {
          const hasQuery = url.includes('?');
          const hasStatus = url.includes('/status');
          const isPostPutDelete = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '');
          const hasAuthHeader = req.headers['authorization'] || req.headers['x-admin-api-key'] || req.headers['X-Admin-API-Key'];
          const isUUID = /^\/admin\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/.test(url);
          
          if (hasQuery || hasStatus || isPostPutDelete || (isUUID && hasAuthHeader)) {
            const httpModule = require('http');
            const proxyReq = httpModule.request({
              hostname: 'localhost',
              port: 8080,
              path: url,
              method: req.method,
              headers: req.headers,
            }, (proxyRes: http.IncomingMessage) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            });
            req.pipe(proxyReq);
            proxyReq.on('error', () => next());
            return;
          }
        }
        
        next();
      });
    },
    proxy: {
      '/api/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      '/api/user/sse': {
        target: 'http://localhost:9998',
        changeOrigin: true,
      },
      '/api/admin/sse': {
        target: 'http://localhost:9998',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/user/threads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/user/messages': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/user/orders': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/admin/threads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/admin/messages': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/analytics': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/contact': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/newsletter': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/comments': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/audio-contact': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
