const express = require('express');
const router = express.Router();
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const permissions = await db.any(`
            select * from crud.permissions order by id
        `);

        res.status(200).json(permissions);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const permission = await db.oneOrNone(`
            select * from crud.permissions where id = \${id}
        `, { id: req.params.id });
        if (!permission) throw new HttpError('ERROR.PERMISSION_NOT_FOUND', 404);

        res.status(200).json(permission);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.permissions where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.PERMISSION_ALREADY_EXISTS', 409);

        const permission = {};
        permission.id = req.body.id;
        permission.name = req.body.name;
        permission.remarks = req.body.remarks;
        permission.isActive = req.body.isActive;
        permission.createdAt = new Date();
        permission.createdBy = req.user.name;
        permission.createdById = req.user.id;
        permission.updatedAt = new Date();
        permission.updatedBy = req.user.name;
        permission.updatedById = req.user.id;

        await db.none(`
            insert into crud.permissions (${snakeize(Object.keys(permission))})
            values (${Object.keys(permission).map(column => '${' + column + '}')})
        `, permission);

        res.status(201).json(permission);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const permission = await db.oneOrNone(`
            select * from crud.permissions where id = \${id}
        `, { id: req.params.id });
        if (!permission) throw new HttpError('ERROR.PERMISSION_NOT_FOUND', 404);

        permission.name = req.body.name;
        permission.remarks = req.body.remarks;
        permission.isActive = req.body.isActive;
        permission.updatedAt = new Date();
        permission.updatedBy = req.user.name;
        permission.updatedById = req.user.id;

        await db.none(`
            update crud.permissions set ${Object.keys(permission).map(column => snakeize(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, permission);

        res.status(200).json(permission);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const permission = await db.oneOrNone(`
            select * from crud.permissions where id = \${id}
        `, { id: req.params.id });
        if (!permission) throw new HttpError('ERROR.PERMISSION_NOT_FOUND', 404);

        await db.none(`
            delete from crud.permissions where id = \${id}
        `, permission);

        res.status(200).json(permission);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
