const express = require('express');
const app = express();
const PORT = 3003;

app.get('/admin/reports', (req, res) => {
  res.send('<h1>Simple Reports Test - Working!</h1><p>If you see this, the route concept works.</p>');
});

app.listen(PORT, () => {
  console.log('Simple test server running on port ' + PORT);
});
