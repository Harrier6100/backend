const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'shipping_date, ship_to_code, product_code, order_number';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.orderNumber) {
            filters.push('order_number = ${orderNumber}');
            filterData.orderNumber = req.query.orderNumber;
        }

        if (req.query.shippingDateFrom) {
            filters.push('shipping_date >= ${shippingDateFrom}');
            filterData.shippingDateFrom = req.query.shippingDateFrom;
        }

        if (req.query.shippingDateTo) {
            filters.push('shipping_date <= ${shippingDateTo}');
            filterData.shippingDateTo = req.query.shippingDateTo;
        }

        const orders = await db.any(`
            select ${field} from orders_cf
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
