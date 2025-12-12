const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();

// Apply the fix
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log('Testing MongoDB connection with Google DNS...');

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('MongoDB Connection Failed:', err);
        process.exit(1);
    });
