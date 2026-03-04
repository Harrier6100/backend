const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const { code, level = 10 } = req.query;

        const recipes = await db.any(`
            with recursive trace as (
                select *, 1 as level from recipe_traces
                where material_code = \${code}
                union all
                select recipe_traces.*, level + 1 from recipe_traces, trace
                where recipe_traces.material_code =
                    case when (trace.product_code ~ '>[0-9]{5}<')
                        then substring(trace.product_code, '[0-9]{5}')
                        else trace.product_code
                    end
                    and recipe_traces.product_code != trace.product_code
                    and level < \${level}
            )
            select * from (select distinct * from trace) as trace
            order by
                trace.level,
                trace.material_code,
                case trace.material_type when 'A' then 1 else 2 end,
                case trace.material_type when 'B' then 1 else 2 end,
                case trace.material_type when 'G' then 1 else 2 end,
                case trace.material_type when 'H' then 1 else 2 end,
                case trace.material_type when 'F' then 1 else 2 end,
                trace.product_code
        `, { code, level });

        res.status(200).json(recipes);
    } catch (err) {
        next(err);
    }
});

router.get('/reverse', async (req, res, next) => {
    try {
        const { code, level = 10 } = req.query;

        const recipes = await db.any(`
            with recursive trace as (
                select *, 1 as level from recipe_traces
                where product_code = \${code}
                union all
                select recipe_traces.*, level + 1 from recipe_traces, trace
                where recipe_traces.product_code =
                    case when (trace.material_code ~ '>[0-9]{5}<')
                        then substring(trace.material_code, '[0-9]{5}')
                        else trace.material_code
                    end
                    and recipe_traces.material_code != trace.material_code
                    and level < \${level}
            )
            select * from (select distinct * from trace) as trace
            order by
                trace.level,
                trace.product_code,
                case trace.material_type when 'A' then 1 else 2 end,
                case trace.material_type when 'B' then 1 else 2 end,
                case trace.material_type when 'G' then 1 else 2 end,
                case trace.material_type when 'H' then 1 else 2 end,
                case trace.material_type when 'F' then 1 else 2 end,
                trace.material_code
        `, { code, level });

        res.status(200).json(recipes);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
