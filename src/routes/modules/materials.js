const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const safe = require('@/middlewares/safe');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.get('/', verify(), safe(async (req, res) => {
    const materials = await db.any(`
        select * from materials order by id
    `);

    res.status(200).json(materials);
}));

router.get('/:id', verify(), safe(async (req, res) => {
    const material = await db.oneOrNone(`
        select * from materials where id = \${id}
    `, { id: req.params.id });
    if (!material) throw new HttpError(404, 'material_not_found');

    res.status(200).json(material);
}));

router.post('/', verify(), safe(async (req, res) => {
    const material = {};
    material.id = req.body.id;
    material.name = req.body.name;
    material.createdAt = new Date();
    material.createdBy = req.user.name;
    material.createdById = req.user.id;
    material.updatedAt = new Date();
    material.updatedBy = req.user.name;
    material.updatedById = req.user.id;

    try {
        await db.none(`
            insert into materials (${Object.keys(material).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(material).map(column => '${'+column+'}').join(', ')})
        `, material);
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'material_already_exists');
        }
        throw err;
    }

    res.status(200).json(material);
}));

router.put('/:id', verify(), safe(async (req, res) => {
    const material = await db.oneOrNone(`
        select * from materials where id = \${id}
    `, { id: req.params.id });
    if (!material) throw new HttpError(404, 'material_not_found');

    material.name = req.body.name;
    material.updatedAt = new Date();
    material.updatedBy = req.user.name;
    material.updatedById = req.user.id;

    await db.none(`
        update materials set ${Object.keys(material).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, material);

    res.status(200).json(material);
}));

router.delete('/:id', verify(), safe(async (req, res) => {
    const material = await db.oneOrNone(`
        select * from materials where id = \${id}
    `, { id: req.params.id });
    if (!material) throw new HttpError(404, 'material_not_found');

    await db.none(`
        delete from materials where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(material);
}));

module.exports = router;
