const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const suppliers = await db.any(`
            select * from crud.suppliers order by id
        `);

        res.status(200).json(suppliers);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const supplier = await db.oneOrNone(`
            select * from crud.suppliers where id = \${id}
        `, { id: req.params.id });
        if (!supplier) throw new HttpError('ERROR.SUPPLIER_NOT_FOUND', 404);

        res.status(200).json(supplier);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.suppliers where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.SUPPLIER_ALREADY_EXISTS', 409);

        const supplier = {};
        supplier.id = req.body.id;
        supplier.name = req.body.name;
        supplier.remarks = req.body.remarks;
        supplier.isActive = req.body.isActive;
        supplier.createdAt = new Date();
        supplier.createdBy = req.user.name;
        supplier.createdById = req.user.id;
        supplier.updatedAt = new Date();
        supplier.updatedBy = req.user.name;
        supplier.updatedById = req.user.id;

        await db.none(`
            insert into crud.suppliers (${snakeize(Object.keys(supplier))})
            values (${Object.keys(supplier).map(column => '${' + column + '}')})
        `, supplier);

        res.status(201).json(supplier);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const supplier = await db.oneOrNone(`
            select * from crud.suppliers where id = \${id}
        `, { id: req.params.id });
        if (!supplier) throw new HttpError('ERROR.SUPPLIER_NOT_FOUND', 404);

        supplier.name = req.body.name;
        supplier.remarks = req.body.remarks;
        supplier.isActive = req.body.isActive;
        supplier.updatedAt = new Date();
        supplier.updatedBy = req.user.name;
        supplier.updatedById = req.user.id;

        await db.none(`
            update crud.suppliers set ${Object.keys(supplier).map(column => snakeize(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, supplier);

        res.status(200).json(supplier);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const supplier = await db.oneOrNone(`
            select * from crud.suppliers where id = \${id}
        `, { id: req.params.id });
        if (!supplier) throw new HttpError('ERROR.SUPPLIER_NOT_FOUND', 404);

        await db.none(`
            delete from crud.suppliers where id = \${id}
        `, supplier);

        res.status(200).json(supplier);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
