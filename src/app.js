const express = require('express');
const compression = require('compression');
const cors = require('cors');
const cookie = require('cookie-parser');
const helmet = require('helmet');
const requestId = require('@/middlewares/requestId');
const cacheControl = require('@/middlewares/cacheControl');
const accessLogger = require('@/middlewares/accessLogger');
const errorLogger = require('@/middlewares/errorLogger');
const errorHandler = require('@/middlewares/errorHandler');
const routeNotFound = require('@/middlewares/routeNotFound');

const corsOptions = {
    origin: true,
    credentials: true,
};

const app = express();
app.set('trust proxy', true);
app.use(requestId);
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookie());
app.use(cacheControl);
app.use(accessLogger);
app.use('/api', require('@/routes'));
app.use(routeNotFound);
app.use(errorLogger);
app.use(errorHandler);

module.exports = app;
