const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const customers = await db.any(`
            select * from crud.customers order by id
        `);

        res.status(200).json(customers);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const customer = await db.oneOrNone(`
            select * from crud.customers where id = \${id}
        `, { id: req.params.id });
        if (!customer) throw new HttpError('ERROR.CUSTOMER_NOT_FOUND', 404);

        res.status(200).json(customer);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.customers where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.CUSTOMER_ALREADY_EXISTS', 409);

        const customer = {};
        customer.id = req.body.id;
        customer.name = req.body.name;
        customer.duns = req.body.duns;
        customer.remarks = req.body.remarks;
        customer.isActive = req.body.isActive;
        customer.createdAt = new Date();
        customer.createdBy = req.user.name;
        customer.createdById = req.user.id;
        customer.updatedAt = new Date();
        customer.updatedBy = req.user.name;
        customer.updatedById = req.user.id;

        await db.none(`
            insert into crud.customers (${snakeize(Object.keys(customer))})
            values (${Object.keys(customer).map(column => '${' + column + '}')})
        `, customer);

        res.status(201).json(customer);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const customer = await db.oneOrNone(`
            select * from crud.customers where id = \${id}
        `, { id: req.params.id });
        if (!customer) throw new HttpError('ERROR.CUSTOMER_NOT_FOUND', 404);

        customer.name = req.body.name;
        customer.duns = req.body.duns;
        customer.remarks = req.body.remarks;
        customer.isActive = req.body.isActive;
        customer.updatedAt = new Date();
        customer.updatedBy = req.user.name;
        customer.updatedById = req.user.id;

        await db.none(`
            update crud.customers set ${Object.keys(customer).map(column => snakeize(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, customer);

        res.status(200).json(customer);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const customer = await db.oneOrNone(`
            select * from crud.customers where id = \${id}
        `, { id: req.params.id });
        if (!customer) throw new HttpError('ERROR.CUSTOMER_NOT_FOUND', 404);

        await db.none(`
            delete from crud.customers where id = \${id}
        `, customer);

        res.status(200).json(customer);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
