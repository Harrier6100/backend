require('dotenv').config();
require('module-alias/register');
const app = require('@/app');
const mongodb = require('@/config/db.mongodb');
const PORT = process.env.PORT;

const start = async () => {
    await mongodb();
    app.listen(PORT, () => {
        console.log('Server is running on port ', PORT);
    });
};
start();
