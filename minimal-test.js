const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;

// Test basic route
app.get('/', (req, res) => {
  console.log('HOME ROUTE HIT!');
  res.send('Home page is working!');
});

// Test reports route
app.get('/admin/reports', (req, res) => {
  console.log('REPORTS ROUTE HIT!');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reports Test</title>
    </head>
    <body>
        <h1>Reports Page Working!</h1>
        <p>The route is registered and working correctly.</p>
        <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('Test server running on port ' + PORT);
  console.log('Test routes:');
  console.log('  GET /');
  console.log('  GET /admin/reports');
});
