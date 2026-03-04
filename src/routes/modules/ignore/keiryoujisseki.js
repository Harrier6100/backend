const express = require('express');
const router = express.Router();
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ?? '*';
        const sort = req.query.sort ?? 'norilotno';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.norilotno) {
            filters.push('norilotno = ${norilotno}');
            filterData.norilotno = req.query.norilotno;
        }

        if (req.query.koujoulotno) {
            filters.push('koujoulotno = ${koujoulotno}');
            filterData.koujoulotno = req.query.koujoulotno;
        }

        const keiryoujisseki = await db.any(`
            select ${field} from keiryoujisseki
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(keiryoujisseki);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
