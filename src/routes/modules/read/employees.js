const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'employee_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.employeeCode) {
            filters.push('employee_code = ${employeeCode}');
            filterData.employeeCode = req.query.employeeCode;
        }

        const employees = await db.any(`
            select ${field} from employees
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(employees);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
