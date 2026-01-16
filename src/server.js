require('dotenv').config();
require('module-alias/register');
const app = require('./app');
const PORT = process.env.PORT;

const start = async () => {
    app.listen(PORT, () => {
        console.log('Server is running on port ', PORT);
    });
};
start();
