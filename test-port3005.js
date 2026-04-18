const express = require('express');
const path = require('path');

const app = express();
const PORT = 3005; // Hardcoded port

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple registration route
app.get('/register', (req, res) => {
  res.send('<h1>Registration Page Works!</h1><p>Test on port 3005</p>');
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
