const express = require('express');
const cors = require('cors');
const cookie = require('cookie-parser');
const compression = require('compression');
const i18n = require('@/i18n');
const cacheControl = require('@/middlewares/cacheControl');
const accessLogger = require('@/middlewares/accessLogger');
const errorLogger = require('@/middlewares/errorLogger');
const errorHandler = require('@/middlewares/errorHandler');
global.HttpError = require('@/errors/HttpError');

const corsOptions = {
    origin: true,
    credentials: true,
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookie());
app.use(compression());
app.use(i18n);
app.use(cacheControl);
app.use(accessLogger);
app.use('/api', require('@/routes'));
app.use(errorLogger);
app.use(errorHandler);

module.exports = app;
