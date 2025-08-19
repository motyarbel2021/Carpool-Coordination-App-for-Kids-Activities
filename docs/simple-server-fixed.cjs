const { serve } = require('@hono/node-server');
const { serveStatic } = require('@hono/node-server/serve-static');
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const fs = require('fs');
const path = require('path');

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Special route for manifest.json with correct content-type
app.get('/manifest.json', (c) => {
  try {
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    return c.json(JSON.parse(manifest));
  } catch (error) {
    console.error('Error reading manifest.json:', error);
    return c.text('Manifest not found', 404);
  }
});

// Special route for service worker
app.get('/sw.js', (c) => {
  try {
    const swPath = path.join(__dirname, 'sw.js');
    const sw = fs.readFileSync(swPath, 'utf8');
    return new Response(sw, {
      headers: {
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': '/'
      }
    });
  } catch (error) {
    console.error('Error reading sw.js:', error);
    return c.text('Service Worker not found', 404);
  }
});

// Serve static files from current directory
app.use('/*', serveStatic({ root: './' }));

// Default route - serve the main HTML file
app.get('/', (c) => {
  try {
    const indexPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    return c.html(html);
  } catch (error) {
    console.error('Error reading index.html:', error);
    return c.text('Error loading page', 500);
  }
});

const port = 3000;
console.log('🚀 Server is running on http://localhost:' + port);

serve({
  fetch: app.fetch,
  port,
});