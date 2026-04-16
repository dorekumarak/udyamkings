require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple registration route
app.get('/register', (req, res) => {
  res.send('<h1>Registration Page Works!</h1><p>Minimal test server</p>');
});

app.listen(PORT, () => {
  console.log(`Minimal test server running on port ${PORT}`);
});
