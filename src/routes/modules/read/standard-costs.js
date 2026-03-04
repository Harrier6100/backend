const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'factory_code, period, product_code, machine_code, process_type, category';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.factoryCode) {
            filters.push('factory_code = ${factoryCode}');
            filterData.factoryCode = req.query.factoryCode;
        }

        if (req.query.period) {
            filters.push('period = ${period}');
            filterData.period = req.query.period;
        }

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.category) {
            filters.push('category = ${category}');
            filterData.category = req.query.category;
        }

        const standardCosts = await db.any(`
            select ${field} from standard_costs
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(standardCosts);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
