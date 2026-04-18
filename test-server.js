const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'UdyamKings - Home',
    description: 'Empowering entrepreneurs with funding and support to build successful businesses.'
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log(`✅ Test server running on: http://localhost:${PORT}`);
  console.log('========================================\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Please stop the other process or use a different port.\n`);
  } else {
    console.error('\n❌ Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test server is shutting down...');
  server.close(() => {
    console.log('✅ Test server has been terminated');
    process.exit(0);
  });
});
