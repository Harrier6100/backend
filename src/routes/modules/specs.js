const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const { verifyToken } = require('@/middlewares');
const { snakeize } = require('@/utils/case');
const db = require('@/config/db.postgres');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const specs = await db.any(`
            select * from specs order by id
        `)

        res.status(200).json(specs);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const spec = await db.oneOrNone(`
            select * from specs where id = \${id}
        `, { id: req.params.id });
        if (!spec) throw new HttpError(req.t('MESSAGE.SPEC_NOT_FOUND'), 404);

        res.status(200).json(spec);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const id = (({ materialId, supplierId }) => {
            return materialId + '_' + supplierId;
        })(req.body);
        const exists = await db.oneOrNone(`
            select * from specs where id = \${id}
        `, { id });
        if (exists) throw new HttpError(req.t('MESSAGE.SPEC_EXISTS'), 409);

        const spec = {};
        spec.id = id;
        spec.materialId = req.body.materialId;
        spec.materialName = req.body.materialName;
        spec.supplierId = req.body.supplierId;
        spec.supplierName = req.body.supplierName;
        spec.specs = JSON.stringify(req.body.specs || []);
        spec.isActive = req.body.isActive;
        spec.remarks = req.body.remarks;
        spec.createdAt = new Date();
        spec.createdBy = req.user.name;
        spec.createdById = req.user.id;
        spec.updatedAt = new Date();
        spec.updatedBy = req.user.name;
        spec.updatedById = req.user.id;

        await db.none(`
            insert into specs (${snakeize(Object.keys(spec))})
            values (${Object.keys(spec).map(c => '${' + c + '}')})
        `, spec);

        res.status(200).json(spec);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const spec = await db.oneOrNone(`
            select * from specs where id = \${id}
        `, { id: req.params.id });
        if (!spec) throw new HttpError(req.t('MESSAGE.SPEC_NOT_FOUND'), 404);

        spec.specs = JSON.stringify(req.body.specs || []);
        spec.remarks = req.body.remarks;
        spec.isActive = req.body.isActive;
        spec.updatedAt = new Date();
        spec.updatedBy = req.user.name;
        spec.updatedById = req.user.id;

        await db.none(`
            update specs set ${Object.keys(spec).map(c => snakeize(c) + ' = ${' + c + '}')}
            where id = \${id}
        `, spec);

        res.status(200).json(spec);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const spec = await db.oneOrNone(`
            select * from specs where id = \${id}
        `, { id: req.params.id });
        if (!spec) throw new HttpError(req.t('MESSAGE.SPEC_NOT_FOUND'), 404);

        await db.none(`
            delete from specs where id = \${id}
        `, spec);

        res.status(200).json(spec);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
