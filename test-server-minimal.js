require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple test route
app.get('/test', (req, res) => {
  res.send('Test route works');
});

// Simple register route
app.get('/register', (req, res) => {
  res.send('<h1>Register Page</h1><p>Minimal test server</p>');
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
