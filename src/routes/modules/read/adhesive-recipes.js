const express = require('express');
const router = express.Router();
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const { adhesiveCode } = req.query;

        const adhesives = await db.any(`
            select * from adhesives
            where adhesive_code = \${adhesiveCode}
                and sequence_number != '00'
            order by adhesive_code, sequence_number
        `, { adhesiveCode });

        const recipes = [];

        for (const adhesive of adhesives) {
            const { materialCode } = adhesive;

            const recipe = await db.oneOrNone(`
                select * from adhesive_recipes
                where adhesive_code = \${adhesiveCode}
                    and material_code = \${materialCode}
            `, { adhesiveCode, materialCode });

            recipes.push(recipe);
        }

        const process = await db.any(`
            select * from adhesive_recipe_procs
            where adhesive_code = \${adhesiveCode}
            order by sequence_number
        `, { adhesiveCode });

        const remarks = await db.any(`
            select * from adhesive_recipe_remarks
            where adhesive_code = \${adhesiveCode}
            order by sequence_number
        `, { adhesiveCode });

        res.status(200).json({ adhesives, recipes, process, remarks });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
