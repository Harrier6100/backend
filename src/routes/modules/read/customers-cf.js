const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'customer_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.customerCode) {
            filters.push('customer_code = ${customerCode}');
            filterData.customerCode = req.query.customerCode;
        }

        const customers = await db.any(`
            select ${field} from customers_cf
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(customers);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'customer_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.customerCode) {
            filters.push('customer_code like any (to_array(${customerCode}))');
            filterData.customerCode = req.query.customerCode;
        }

        if (req.query.customerName) {
            filters.push('customer_name like any (to_array(${customerName}))');
            filterData.customerName = req.query.customerName;
        }

        const customers = await db.any(`
            select ${field} from customers_cf
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(customers);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
