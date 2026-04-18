const { sequelize } = require('./models');

async function initializeDatabase() {
    try {
        // Test the connection
        await sequelize.authenticate();
        console.log('Connection to the database has been established successfully.');
        
        // Sync all models
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');
        
        // You can add any initial data here if needed
        
        console.log('Database initialization complete.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to initialize the database:', error);
        process.exit(1);
    }
}

initializeDatabase();
