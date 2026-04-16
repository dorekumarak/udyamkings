require('dotenv').config({ path: '.env.test' });
const knex = require('knex');
const fs = require('fs');
const path = require('path');

// Ensure test uploads directory exists
const uploadDir = path.join(__dirname, '..', 'test-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize test database
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './test-db.sqlite'
  },
  useNullAsDefault: true
});

// Run migrations for test database
async function setupTestDB() {
  try {
    // Run migrations
    await db.migrate.latest();
    console.log('✅ Test database migrations complete');
    
    // Seed test data
    await db.seed.run();
    console.log('✅ Test data seeded');
    
    return db;
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

module.exports = setupTestDB;
