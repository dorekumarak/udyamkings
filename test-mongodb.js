const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/udyamkings_db?directConnection=true&serverSelectionTimeoutMS=2000');
    console.log('✅ Successfully connected to MongoDB');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

testConnection();
