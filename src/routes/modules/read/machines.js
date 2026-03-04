const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'machine_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.isInactiveDataIncluded !== 'true') {
            filters.push("status != 'D'");
        }

        const machines = await db.any(`
            select ${field} from machines
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(machines);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
