const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'plan_id';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.shippingDateFrom) {
            filters.push('shipping_date >= ${shippingDateFrom}');
            filterData.shippingDateFrom = req.query.shippingDateFrom;
        }

        if (req.query.shippingDateTo) {
            filters.push('shipping_date <= ${shippingDateTo}');
            filterData.shippingDateTo = req.query.shippingDateTo;
        }

        const shippingRecords = await db.any(`
            select ${field} from shipping_records_cf
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(shippingRecords);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'plan_id';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.shippingDateFrom) {
            filters.push('shipping_date >= ${shippingDateFrom}');
            filterData.shippingDateFrom = req.query.shippingDateFrom;
        }

        if (req.query.shippingDateTo) {
            filters.push('shipping_date <= ${shippingDateTo}');
            filterData.shippingDateTo = req.query.shippingDateTo;
        }

        const shippingRecords = await db.any(`
            select ${field} from shipping_records_cf
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(shippingRecords);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
