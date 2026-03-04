const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code, test_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.testCode) {
            filters.push('test_code = ${testCode}');
            filterData.testCode = req.query.testCode;
        }

        if (req.query.isCustomerSpecIncluded !== 'true') {
            filters.push("customer_code = ''");
        }

        const physpropSpecs = await db.any(`
            select ${field} from physprop_specs_ho
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(physpropSpecs);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
