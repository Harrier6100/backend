const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.get('/', async (req, res) => {
    const locales = await db.any(`
        select * from locales order by id
    `);

    res.status(200).json(locales);
});

router.get('/:id', verify(), async (req, res) => {
    const locale = await db.oneOrNone(`
        select * from locales where id = \${id}
    `, { id: req.params.id });
    if (!locale) throw new HttpError(404, 'locale_not_found');

    res.status(200).json(locale);
});

router.post('/', verify(), async (req, res) => {
    try {
        const locale = {};
        locale.id = req.body.id;
        locale.translations = JSON.stringify(req.body.translations || []);
        locale.createdAt = new Date();
        locale.createdBy = req.user.name;
        locale.createdById = req.user.id;
        locale.updatedAt = new Date();
        locale.updatedBy = req.user.name;
        locale.updatedById = req.user.id;

        await db.none(`
            insert into locales (${Object.keys(locale).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(locale).map(column => '${'+column+'}').join(', ')})
        `, locale);

        res.status(200).json(locale);
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'locale_already_exists');
        }
        throw err;
    }
});

router.put('/:id', verify(), async (req, res) => {
    const locale = await db.oneOrNone(`
        select * from locales where id = \${id}
    `, { id: req.params.id });
    if (!locale) throw new HttpError(404, 'locale_not_found');

    locale.translations = JSON.stringify(req.body.translations || []);
    locale.updatedAt = new Date();
    locale.updatedBy = req.user.name;
    locale.updatedById = req.user.id;

    await db.none(`
        update locales set ${Object.keys(locale).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, locale);

    res.status(200).json(locale);
});

router.delete('/:id', verify(), async (req, res) => {
    const locale = await db.oneOrNone(`
        select * from locales where id = \${id}
    `, { id: req.params.id });
    if (!locale) throw new HttpError(404, 'locale_not_found');

    await db.none(`
        delete from locales where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(locale);
});

module.exports = router;
