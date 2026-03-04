const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'adhesive_code, sequence_number';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.adhesiveCode) {
            filters.push('adhesive_code = ${adhesiveCode}');
            filterData.adhesiveCode = req.query.adhesiveCode;
        }

        if (req.query.materialCode) {
            filters.push('material_code = ${materialCode}');
            filterData.materialCode = req.query.materialCode;
        }

        if (req.query.isInactiveDataIncluded !== 'true') {
            filters.push("status != 'D'");
        }

        const adhesives = await db.any(`
            select ${field} from adhesives
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(adhesives);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
