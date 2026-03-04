const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const { testLot } = req.query;

        const physpropValues = await db.any(`
            select * from physprop_values_ho
            where test_lot = \${testLot}
                and test_number = '099'
        `, { testLot });

        const means = {};
        for (const physpropValue of physpropValues) {
            const { physpropCode, propertyValue } = physpropValue;
            means[physpropCode] = propertyValue;
        }

        res.status(200).json(means);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
