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

        if (req.query.planId) {
            filters.push('plan_id = ${planId}');
            filterData.planId = req.query.planId;
        }

        if (req.query.rpNumber) {
            filters.push('rp_number = ${rpNumber}');
            filterData.rpNumber = req.query.rpNumber;
        }

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.cuttingDateFrom) {
            filters.push('cutting_date >= ${cuttingDateFrom}');
            filterData.cuttingDateFrom = req.query.cuttingDateFrom;
        }

        if (req.query.cuttingDateTo) {
            filters.push('cutting_date <= ${cuttingDateTo}');
            filterData.cuttingDateTo = req.query.cuttingDateTo;
        }

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        const cuttingPlans = await db.any(`
            select ${field} from cutting_plans
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(cuttingPlans);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
