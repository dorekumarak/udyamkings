// Simple test to check if server is working
const express = require('express');
const app = express();
const PORT = 3002;

app.get('/test-simple', (req, res) => {
  console.log('SIMPLE TEST ROUTE HIT!');
  res.send('Simple test is working!');
});

app.get('/admin/reports-simple', (req, res) => {
  console.log('SIMPLE REPORTS ROUTE HIT!');
  res.send('Simple reports page is working!');
});

app.listen(PORT, () => {
  console.log('Simple test server running on port ' + PORT);
});
