const express = require('express');
const app = express();
const PORT = 3002;

// Test route
app.get('/admin/reports', (req, res) => {
  console.log('ADMIN REPORTS ROUTE HIT!');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reports Test</title>
    </head>
    <body>
        <h1>Reports Page Working!</h1>
        <p>If you see this, the route is working correctly.</p>
        <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

// Home route
app.get('/', (req, res) => {
  res.send('<h1>Home Page</h1><p><a href="/admin/reports">Go to Reports</a></p>');
});

app.listen(PORT, () => {
  console.log('Test server running on http://localhost:' + PORT);
  console.log('Try accessing: http://localhost:' + PORT + '/admin/reports');
});
