const { serve } = require('@hono/node-server');
const { serveStatic } = require('@hono/node-server/serve-static');
const { Hono } = require('hono');
const { cors } = require('hono/cors');

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Serve static files from dist directory
app.use('/*', serveStatic({ root: './dist' }));

// Default route - serve the main HTML
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ניהול הסעות החוג</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <link href="/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="root"></div>
        <script type="text/babel" src="/app.js"></script>
    </body>
    </html>
  `);
});

const port = 3000;
console.log('🚀 Server is running on http://localhost:' + port);

serve({
  fetch: app.fetch,
  port,
});