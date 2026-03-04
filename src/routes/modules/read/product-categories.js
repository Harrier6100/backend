const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'category_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.categoryCode) {
            filters.push('category_code = ${categoryCode}');
            filterData.categoryCode = req.query.categoryCode;
        }

        const productCategories = await db.any(`
            select ${field} from product_categories
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(productCategories);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
