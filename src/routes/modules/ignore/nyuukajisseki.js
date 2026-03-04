const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'koujoulotno';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.koujoulotno) {
            filters.push('koujoulotno = ${koujoulotno}');
            filterData.koujoulotno = req.query.koujoulotno;
        }

        const nyuukajisseki = await db.any(`
            select ${field} from nyuukajisseki
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(nyuukajisseki);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
