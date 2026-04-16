const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
