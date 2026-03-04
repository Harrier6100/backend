const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'property_code, factory_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.propertyCode) {
            filters.push('property_code = ${propertyCode}');
            filterData.propertyCode = req.query.propertyCode;
        }

        const physprops = await db.any(`
            select ${field} from physprops_kn
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(physprops);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
