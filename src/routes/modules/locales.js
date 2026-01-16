const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const locales = await db.any(`
            select * from crud.locales order by id
        `);

        res.status(200).json(locales);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await db.oneOrNone(`
            select * from crud.locales where id = \${id}
        `, { id: req.params.id });
        if (!locale) throw new HttpError('ERROR.LOCALE_NOT_FOUND', 404);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.locales where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.LOCALE_ALREADY_EXISTS', 409);

        const locale = {};
        locale.id = req.body.id;
        locale.locales = req.body.locales;
        locale.isActive = req.body.isActive;
        locale.createdAt = new Date();
        locale.createdBy = req.user.name;
        locale.createdById = req.user.id;
        locale.updatedAt = new Date();
        locale.updatedBy = req.user.name;
        locale.updatedById = req.user.id;

        await db.none(`
            insert into crud.locales (${snakeize(Object.keys(locale))})
            values (${Object.keys(locale).map(column => '${' + column + '}')})
        `, locale);

        res.status(201).json(locale);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await db.oneOrNone(`
            select * from crud.locales where id = \${id}
        `, { id: req.params.id });
        if (!locale) throw new HttpError('ERROR.LOCALE_NOT_FOUND', 404);

        locale.locales = req.body.locales;
        locale.isActive = req.body.isActive;
        locale.updatedAt = new Date();
        locale.updatedBy = req.user.name;
        locale.updatedById = req.user.id;

        await db.none(`
            update crud.locales set ${Object.keys(locale).map(column => snakeize(column) + ' = ${' + column + '}')}
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
            select * from crud.locales where id = \${id}
        `, { id: req.params.id });
        if (!locale) throw new HttpError('ERROR.LOCALE_NOT_FOUND', 404);

        await db.none(`
            delete from crud.locales where id = \${id}
        `, locale);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
