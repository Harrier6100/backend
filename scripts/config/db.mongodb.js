require('dotenv').config();
const mongoose = require('mongoose');

const db = async () => {
    try {
        await mongoose.connect(process.env.MONGODB);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = db;
