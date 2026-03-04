const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : `
            product_code,
            process_type,
            case material_type when 'A' then 1 else 2 end,
            case material_type when 'B' then 1 else 2 end,
            case material_type when 'G' then 1 else 2 end,
            case material_type when 'H' then 1 else 2 end,
            case material_type when 'F' then 1 else 2 end,
            sequence_number
        `;

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.materialCode) {
            filters.push('material_code = ${materialCode}');
            filterData.materialCode = req.query.materialCode;
        }

        const recipes = await db.any(`
            select ${field} from recipes
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(recipes);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
