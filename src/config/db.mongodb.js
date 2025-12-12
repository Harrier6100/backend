const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const db = async () => {
    try {
        await mongoose.connect(process.env.MONGODB);
        mongoose.Promise = global.Promise;
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = db;
