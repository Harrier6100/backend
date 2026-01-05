const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const verifyToken = require('@/middlewares/verifyToken');
const requireRole = require('@/middlewares/requireRole');
const requirePermission = require('@/middlewares/requirePermission');
const { snakeize } = require('@/utils/case');
const db = require('@/config/db.postgres');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const locales = await db.any(`
            select * from locales order by id
        `);

        res.status(200).json(locales);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await db.oneOrNone(`
            select * from locales where id = \${id}
        `, { id: req.params.id });
        if (!locale) throw new HttpError(req.t('MESSAGE.LOCALE_NOT_FOUND'), 404);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const locale = {
            id: req.body.id,
            locales: req.body.locales,
            createdAt: new Date(),
            createdBy: req.user.name,
            createdById: req.user.id,
            updatedAt: new Date(),
            updatedBy: req.user.name,
            updatedById: req.user.id,
        };

        const exists = await db.oneOrNone(`
            select * from locales where id = \${id}
        `, locale);
        if (exists) throw new HttpError(req.t('MESSAGE.LOCALE_EXISTS'), 409);

        await db.none(`
            insert into locales (${snakeize(Object.keys(locale))})
            values (${Object.keys(locale).map(c => '${' + c + '}')})
        `, locale);

        res.status(201).json(locale);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await db.oneOrNone(`
            select * from locales where id = \${id}
        `, { id: req.params.id });
        if (!locale) throw new HttpError(req.t('MESSAGE.LOCALE_NOT_FOUND'), 404);

        locale.locales = req.body.locales ?? locale.locales;
        locale.updatedAt = new Date();
        locale.updatedBy = req.user.name;
        locale.updatedById = req.user.id;

        await db.none(`
            update locales set ${Object.keys(locale).map(c => snakeize(c) + ' = ${' + c + '}')}
            where id = \${id}
        `, locale);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await db.oneOrNone(`
            select * from locales where id = \${id}
        `, { id: req.params.id });
        if (!locale) throw new HttpError(req.t('MESSAGE.LOCALE_NOT_FOUND'), 404);

        await db.none(`
            delete from locales where id = \${id}
        `, locale);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
