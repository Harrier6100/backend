const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const { coatingLot } = req.query;

        const coatingMaterials = await db.any(`
            select * from coating_materials
            where coating_lot = \${coatingLot}
            order by
                case material_type when 'A' then 1 else 2 end,
                case material_type when 'B' then 1 else 2 end,
                case material_type when 'G' then 1 else 2 end,
                case material_type when 'H' then 1 else 2 end,
                case material_type when 'F' then 1 else 2 end
        `, { coatingLot });

        for (const index in coatingMaterials) {
            const coatingMaterial = coatingMaterials[index];

            const item = await db.oneOrNone(`
                select * from items
                where material_code = left(\${materialCode}, 9)
            `, { materialCode: coatingMaterial.materialCode });

            if (item) {
                coatingMaterial.materialName = item.materialName;
            } else {
                if (coatingMaterial.materialType === 'F') {
                    coatingMaterial.materialName = coatingMaterial.materialCode;
                }

                const traces = await db.any(`
                    select * from traces
                    where after_lot = \${materialLot}
                        and material_type = 'F'
                    order by before_lot
                `, { materialLot: coatingMaterial.materialLot });

                coatingMaterial.traces = traces;
            }

            coatingMaterials[index] = coatingMaterial;
        }

        res.status(200).json(coatingMaterials);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
