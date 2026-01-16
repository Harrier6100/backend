const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const propertySpecs = await db.any(`
            select * from crud.property_specs order by id
        `);

        res.status(200).json(propertySpecs);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const propertySpec = await db.oneOrNone(`
            select * from crud.property_specs where id = \${id}
        `, { id: req.params.id });
        if (!propertySpec) throw new HttpError('ERROR.PROPERTY_SPEC_NOT_FOUND', 404);

        res.status(200).json(propertySpec);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const id = (({ materialId, supplierId }) => {
            return materialId + '-' + supplierId;
        })(req.body);
        const exists = await db.oneOrNone(`
            select * from crud.property_specs where id = \${id}
        `, { id });
        if (exists) throw new HttpError('ERROR.PROPERTY_SPEC_ALREADY_EXISTS', 409);

        const propertySpec = {};
        propertySpec.id = id;
        propertySpec.materialId = req.body.materialId;
        propertySpec.materialName = req.body.materialName;
        propertySpec.supplierId = req.body.supplierId;
        propertySpec.supplierName = req.body.supplierName;
        propertySpec.specs = JSON.stringify(req.body.specs || []);
        propertySpec.isActive = req.body.isActive;
        propertySpec.remarks = req.body.remarks;
        propertySpec.createdAt = new Date();
        propertySpec.createdBy = req.user.name;
        propertySpec.createdById = req.user.id;
        propertySpec.updatedAt = new Date();
        propertySpec.updatedBy = req.user.name;
        propertySpec.updatedById = req.user.id;

        await db.none(`
            insert into crud.property_specs (${snakeize(Object.keys(propertySpec))})
            values (${Object.keys(propertySpec).map(column => '${' + column + '}')})
        `, propertySpec);

        res.status(201).json(propertySpec);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const propertySpec = await db.oneOrNone(`
            select * from crud.property_specs where id = \${id}
        `, { id: req.params.id });
        if (!propertySpec) throw new HttpError('ERROR.PROPERTY_SPEC_NOT_FOUND', 404);

        propertySpec.specs = JSON.stringify(req.body.specs || []);
        propertySpec.remarks = req.body.remarks;
        propertySpec.isActive = req.body.isActive;
        propertySpec.updatedAt = new Date();
        propertySpec.updatedBy = req.user.name;
        propertySpec.updatedById = req.user.id;

        await db.none(`
            update crud.property_specs set ${Object.keys(propertySpec).map(column => snakeize(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, propertySpec);

        res.status(200).json(propertySpec);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const propertySpec = await db.oneOrNone(`
            select * from crud.property_specs where id = \${id}
        `, { id: req.params.id });
        if (!propertySpec) throw new HttpError('ERROR.PROPERTY_NOT_FOUND', 404);

        await db.none(`
            delete from crud.property_specs where id = \${id}
        `, propertySpec);

        res.status(200).json(propertySpec);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
