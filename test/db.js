const knex = require('knex');
const config = require('../knexfile');

// Create a test database connection
const testDb = knex(config.test);

// Function to initialize the test database
async function initTestDB() {
  try {
    // Run migrations
    await testDb.migrate.latest();
    console.log('✅ Test database migrations complete');
    
    // Run seeds
    await testDb.seed.run();
    console.log('✅ Test data seeded');
    
    return testDb;
  } catch (error) {
    console.error('Error initializing test database:', error);
    process.exit(1);
  }
}

// Function to clean up the test database
export async function cleanupDB() {
  try {
    // Rollback all migrations
    await testDb.migrate.rollback();
    
    // Run migrations again to have a clean state
    await testDb.migrate.latest();
    await testDb.seed.run();
    
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}

// Function to close the database connection
export async function closeDB() {
  await testDb.destroy();
  console.log('✅ Database connection closed');
}

module.exports = {
  testDb,
  initTestDB,
  cleanupDB,
  closeDB,
};
