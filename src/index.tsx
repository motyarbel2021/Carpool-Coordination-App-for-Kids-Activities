import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// API routes for the class scheduling system
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Class Scheduler!' })
})

// Default route - serve the main React app
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
  `)
})

export default app