const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'order_number';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.orderNumber) {
            filters.push('order_number = ${orderNumber}');
            filterData.orderNumber = req.query.orderNumber;
        }

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        const productionOrders = await db.any(`
            select ${field} from production_orders
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(productionOrders);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
