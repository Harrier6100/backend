const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const safe = require('@/middlewares/safe');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.post('/', verify(), safe(async (req, res) => {
    const propertyIds = JSON.parse(req.body.specs).map((spec) => spec.propertyId);
    if (new Set(propertyIds).size !== propertyIds.length) {
        throw new HttpError(400, 'duplicate_property_id');
    }

    const materialSpec = {};
    materialSpec.materialId = req.body.materialId;
    materialSpec.supplierId = req.body.supplierId;
    materialSpec.activeStart = new Date(req.body.activeStart);
    materialSpec.specs = req.body.specs;
    materialSpec.createdAt = new Date();
    materialSpec.createdBy = req.user.name;
    materialSpec.createdById = req.user.id;
    materialSpec.updatedAt = new Date();
    materialSpec.updatedBy = req.user.name;
    materialSpec.updatedById = req.user.id;

    await db.tx(async tx => {
        // 材料の同時登録で版番号が重複しないよう、材料の行をロック
        const material = await tx.oneOrNone(`
            select id from materials where id = \${materialId} for update;
        `, materialSpec);
        if (!material) throw new HttpError(404, 'material_not_found');

        const supplier = await tx.oneOrNone(`
            select id from suppliers where id = \${supplierId}
        `, materialSpec);
        if (!supplier) throw new HttpError(404, 'supplier_not_found');

        // 物性コードがすべて存在するかチェック
        const { count } = await tx.one(`
            select count(*)::int as count from properties
            where id in (\${propertyIds:csv})
        `, { propertyIds });
        if (count !== propertyIds.length) throw new HttpError(400, 'property_not_found');

        // 直前の版
        const previousSpec = await tx.oneOrNone(`
            select spec_id, active_start from material_specs
            where material_id = \${materialId}
                and supplier_id = \${supplierId}
            order by version_number desc limit 1
        `, materialSpec);

        if (previousSpec) {
            if (materialSpec.activeStart <= previousSpec.activeStart) {
                throw new HttpError(400, 'invalid_active_start');
            }

            // 前の版の有効期間を閉じる
            await tx.none(`
                update material_specs set
                    active_end = \${activeStart},
                    updated_at = \${updatedAt},
                    updated_by = \${updatedBy},
                    updated_by_id = \${updatedById}
                where spec_id = \${specId}
            `, { ...materialSpec, specId: previousSpec.specId });
        }

        // 版番号を採番
        const { next } = await tx.one(`
            select coalesce(max(version_number), 0) + 1 as next
            from material_specs
            where material_id = \${materialId}
                and supplier_id = \${supplierId}
        `, materialSpec);
        materialSpec.versionNumber = next;

        const { specId } = await tx.one(`
            insert into material_specs (${Object.keys(materialSpec).map((column) => snakecase(column)).join(', ')})
            values (${Object.keys(materialSpec).map((column) => '${'+column+'}').join(', ')})
            returning spec_id
        `, materialSpec);
        materialSpec.specId = specId;
    });

    res.status(200).json(materialSpec);
}));

module.exports = router;
