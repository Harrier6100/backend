require('dotenv').config();
require('module-alias/register');
const app = require('./app');

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}`);
});
