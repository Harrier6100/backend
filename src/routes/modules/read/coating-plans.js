const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'coating_date, machine_code, sequence_number';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.planId) {
            filters.push('plan_id = ${planId}');
            filterData.planId = req.query.planId;
        }

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.coatingDateFrom) {
            filters.push('coating_date >= ${coatingDateFrom}');
            filterData.coatingDateFrom = req.query.coatingDateFrom;
        }

        if (req.query.coatingDateTo) {
            filters.push('coating_date <= ${coatingDateTo}');
            filterData.coatingDateTo = req.query.coatingDateTo;
        }

        if (req.query.period) {
            filters.push('period = ${period}');
            filterData.period = req.query.period;
        }

        if (req.query.periodWeek) {
            filters.push('period_week = ${periodWeek}');
            filterData.periodWeek = req.query.periodWeek;
        }

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        const coatingPlans = await db.any(`
            select ${field} from coating_plans
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        for (const index in coatingPlans) {
            const coatingPlan = coatingPlans[index];

            const { productCode, machineCode } = coatingPlan;

            const recipes = await db.any(`
                select * from recipes
                where product_code = \${productCode}
                    and machine_code = \${machineCode}
                    and material_type = 'F'
            `, { productCode, machineCode });

            coatingPlan.recipes = recipes;

            coatingPlans[index] = coatingPlan;
        }

        res.status(200).json(coatingPlans);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
