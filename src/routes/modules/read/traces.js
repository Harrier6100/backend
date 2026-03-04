const express = require('express');
const router = express.Router();
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const { lot, level = 10 } = req.query;

        const traces = await db.any(`
            with recursive trace as (
                select *, 1 as level from traces
                    where before_lot = \${lot}
                union all
                select traces.*, level + 1 from traces, trace
                    where traces.before_lot = trace.after_lot
                        and level < \${level}
            )
            select * from trace
            order by
                trace.level,
                trace.before_lot,
                case trace.material_type when 'A' then 1 else 2 end,
                case trace.material_type when 'B' then 1 else 2 end,
                case trace.material_type when 'G' then 1 else 2 end,
                case trace.material_type when 'H' then 1 else 2 end,
                case trace.material_type when 'F' then 1 else 2 end,
                trace.after_lot
        `, { lot, level });

        res.status(200).json(traces);
    } catch (err) {
        next(err);
    }
});

router.get('/reverse', async (req, res, next) => {
    try {
        const { lot, level = 10 } = req.query;

        const traces = await db.any(`
            with recursive trace as (
                select *, 1 as level from traces
                    where after_lot = \${lot}
                union all
                select traces.*, level + 1 from traces, trace
                    where traces.after_lot = trace.before_lot
                        and level < \${level}
            )
            select * from trace
            order by
                trace.level,
                trace.after_lot,
                case trace.material_type when 'A' then 1 else 2 end,
                case trace.material_type when 'B' then 1 else 2 end,
                case trace.material_type when 'G' then 1 else 2 end,
                case trace.material_type when 'H' then 1 else 2 end,
                case trace.material_type when 'F' then 1 else 2 end,
                trace.before_lot
        `, { lot, level });

        res.status(200).json(traces);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
