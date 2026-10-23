const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const safe = require('@/middlewares/safe');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.get('/', verify(), safe(async (req, res) => {
    const suppliers = await db.any(`
        select * from suppliers order by id
    `);

    res.status(200).json(suppliers);
}));

router.get('/:id', verify(), safe(async (req, res) => {
    const supplier = await db.oneOrNone(`
        select * from suppliers where id = \${id}
    `, { id: req.params.id });
    if (!supplier) throw new HttpError(404, 'supplier_not_found');

    res.status(200).json(supplier);
}));

router.post('/', verify(), safe(async (req, res) => {
    const supplier = {};
    supplier.id = req.body.id;
    supplier.name = req.body.name;
    supplier.createdAt = new Date();
    supplier.createdBy = req.user.name;
    supplier.createdById = req.user.id;
    supplier.updatedAt = new Date();
    supplier.updatedBy = req.user.name;
    supplier.updatedById = req.user.id;

    try {
        await db.none(`
            insert into suppliers (${Object.keys(supplier).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(supplier).map(column => '${'+column+'}').join(', ')})
        `, supplier);
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'supplier_already_exists');
        }
        throw err;
    }

    res.status(200).json(supplier);
}));

router.put('/:id', verify(), safe(async (req, res) => {
    const supplier = await db.oneOrNone(`
        select * from suppliers where id = \${id}
    `, { id: req.params.id });
    if (!supplier) throw new HttpError(404, 'supplier_not_found');

    supplier.name = req.body.name;
    supplier.updatedAt = new Date();
    supplier.updatedBy = req.user.name;
    supplier.updatedById = req.user.id;

    await db.none(`
        update suppliers set ${Object.keys(supplier).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, supplier);

    res.status(200).json(supplier);
}));

router.delete('/:id', verify(), safe(async (req, res) => {
    const supplier = await db.oneOrNone(`
        select * from suppliers where id = \${id}
    `, { id: req.params.id });
    if (!supplier) throw new HttpError(404, 'supplier_not_found');

    await db.none(`
        delete from suppliers where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(supplier);
}));

module.exports = router;
