const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'material_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.materialCode) {
            filters.push('material_code = ${materialCode}');
            filterData.materialCode = req.query.materialCode;
        }

        const materials = await db.any(`
            select ${field} from materials
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(materials);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.materialCode) {
            filters.push('material_code like any (to_array(${materialCode}))');
            filterData.materialCode = req.query.materialCode;
        }

        if (req.query.materialName) {
            filters.push('material_name like any (to_array(${materialName}))');
            filterData.materialName = req.query.materialName;
        }

        const materials = await db.any(`
            select ${field} from materials
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(materials);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
