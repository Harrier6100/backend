const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const properties = await db.any(`
            select * from crud.properties
            where right(id, 2) != '__'
            order by id
        `);

        res.status(200).json(properties);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const property = await db.oneOrNone(`
            select * from crud.properties where id = \${id}
        `, { id: req.params.id });
        if (!property) throw new HttpError('ERROR.PROPERTY_NOT_FOUND', 404);

        res.status(200).json(property);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.properties where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.PROPERTY_ALREADY_EXISTS', 409);

        const property = {};
        property.id = req.body.id;
        property.name = req.body.name;
        property.uom = req.body.uom;
        property.createdAt = new Date();
        property.createdBy = req.user.name;
        property.createdById = req.user.id;
        property.updatedAt = new Date();
        property.updatedBy = req.user.name;
        property.updatedById = req.user.id;

        await db.none(`
            insert into crud.properties (${snakeize(Object.keys(property))})
            values (${Object.keys(property).map(column => '${' + column + '}')})
        `, property);

        res.status(201).json(property);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const property = await db.oneOrNone(`
            select * from crud.properties where id = \${id}
        `, { id: req.params.id });
        if (!property) throw new HttpError('ERROR.PROPERTY_NOT_FOUND', 404);

        property.name = req.body.name;
        property.uom = req.body.uom;
        property.updatedAt = new Date();
        property.updatedBy = req.user.name;
        property.updatedById = req.user.id;

        await db.none(`
            update crud.properties set ${Object.keys(property).map(column => snakeize(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, property);

        res.status(200).json(property);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const property = await db.oneOrNone(`
            select * from crud.properties where id = \${id}
        `, { id: req.params.id });
        if (!property) throw new HttpError('ERROR.PROPERTY_NOT_FOUND', 404);

        await db.none(`
            delete from crud.properties where id = \${id}
        `, property);

        res.status(200).json(property);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
