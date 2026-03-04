const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        const products = await db.any(`
            select ${field} from products
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(products);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.productCode) {
            filters.push('product_code like any (to_array(${productCode}))');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.productName) {
            filters.push('product_name like any (to_array(${productName}))');
            filterData.productName = req.query.productName;
        }

        const products = await db.any(`
            select ${field} from products
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(products);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
