const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const materials = await db.any(`
            select * from crud.materials order by id
        `);

        res.status(200).json(materials);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const material = await db.oneOrNone(`
            select * from crud.materials where id = \${id}
        `, { id: req.params.id });
        if (!material) throw new HttpError('ERROR.MATERIAL_NOT_FOUND', 404);

        res.status(200).json(material);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.materials where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.MATERIAL_ALREADY_EXISTS', 409);

        const material = {};
        material.id = req.body.id;
        material.name = req.body.name;
        material.isActive = req.body.isActive;
        material.createdAt = new Date();
        material.createdBy = req.user.name;
        material.createdById = req.user.id;
        material.updatedAt = new Date();
        material.updatedBy = req.user.name;
        material.updatedById = req.user.id;

        await db.none(`
            insert into crud.materials (${snakeize(Object.keys(material))})
            values (${Object.keys(material).map(column => '${' + column + '}')})
        `, material);

        res.status(201).json(material);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const material = await db.oneOrNone(`
            select * from crud.materials where id = \${id}
        `, { id: req.params.id });
        if (!material) throw new HttpError('ERROR.MATERIALS_NOT_FOUND', 404);

        material.name = req.body.name;
        material.isActive = req.body.isActive;
        material.updatedAt = new Date();
        material.updatedBy = req.user.name;
        material.updatedById = req.user.id;

        await db.none(`
            update crud.materials set ${Object.keys(material).map(column => snakeize(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, material);

        res.status(200).json(material);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const material = await db.oneOrNone(`
            select * from crud.materials where id = \${id}
        `, { id: req.params.id });
        if (!material) throw new HttpError('ERROR.MATERIAL_NOT_FOUND', 404);

        await db.none(`
            delete from crud.materials where id = \${id}
        `, material);

        res.status(200).json(material);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
