const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const safe = require('@/middlewares/safe');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.get('/', verify(), safe(async (req, res) => {
    const properties = await db.any(`
        select * from properties order by id
    `);

    res.status(200).json(properties);
}));

router.get('/:id', verify(), safe(async (req, res) => {
    const property = await db.oneOrNone(`
        select * from properties where id = \${id}
    `, { id: req.params.id });
    if (!property) throw new HttpError(404, 'property_not_found');

    res.status(200).json(property);
}));

router.post('/', verify(), safe(async (req, res) => {
    const property = {};
    property.id = req.body.id;
    property.name = req.body.name;
    property.createdAt = new Date();
    property.createdBy = req.user.name;
    property.createdById = req.user.id;
    property.updatedAt = new Date();
    property.updatedBy = req.user.name;
    property.updatedById = req.user.id;

    try {
        await db.none(`
            insert into properties (${Object.keys(property).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(property).map(column => '${'+column+'}').join(', ')})
        `, property);
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'property_already_exists');
        }
        throw err;
    }

    res.status(200).json(property);
}));

router.put('/:id', verify(), safe(async (req, res) => {
    const property = await db.oneOrNone(`
        select * from properties where id = \${id}
    `, { id: req.params.id });
    if (!property) throw new HttpError(404, 'property_not_found');

    property.name = req.body.name;
    property.updatedAt = new Date();
    property.updatedBy = req.user.name;
    property.updatedById = req.user.id;

    await db.none(`
        update properties set ${Object.keys(property).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, property);

    res.status(200).json(property);
}));

router.delete('/:id', verify(), safe(async (req, res) => {
    const property = await db.oneOrNone(`
        select * from properties where id = \${id}
    `, { id: req.params.id });
    if (!property) throw new HttpError(404, 'property_not_found');

    await db.none(`
        delete from properties where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(property);
}));

module.exports = router;
