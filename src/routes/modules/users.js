const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const HttpError = require('@/errors/HttpError');
const verifyToken = require('@/middlewares/verifyToken');
const requireRole = require('@/middlewares/requireRole');
const requirePermission = require('@/middlewares/requirePermission');
const { snakeize } = require('@/utils/case');
const db = require('@/config/db.postgres');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const users = await db.any(`
            select * from users order by id
        `);

        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id: req.params.id });
        if (!user) throw new HttpError(req.t('MESSAGE.USER_NOT_FOUND'), 404);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const user = {
            id: req.body.id,
            name: req.body.name,
            password: await bcrypt.hash(req.body.id, 10),
            role: req.body.role,
            permissions: req.body.permissions,
            expiryDate: req.body.expiryDate || null,
            remarks: req.body.remarks,
            isActive: req.body.isActive,
            createdAt: new Date(),
            createdBy: req.user.name,
            createdById: req.user.id,
            updatedAt: new Date(),
            updatedBy: req.user.name,
            updatedById: req.user.id,
        };

        const exists = await db.oneOrNone(`
            select * from users where id = \${id}
        `, user);
        if (exists) throw new HttpError(req.t('MESSAGE.USER_EXISTS'), 409);

        await db.none(`
            insert into users (${snakeize(Object.keys(user))})
            values (${Object.keys(user).map(c => '${' + c + '}')})
        `, user);

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id: req.params.id });
        if (!user) throw new HttpError(req.t('MESSAGE.USER_NOT_FOUND'), 404);

        user.name = req.body.name;
        user.role = req.body.role;
        user.permissions = req.body.permissions;
        user.expiryDate = req.body.expiryDate || null;
        user.remarks = req.body.remarks;
        user.isActive = req.body.isActive;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;

        await db.none(`
            update users set ${Object.keys(user).map(c => snakeize(c) + ' = ${' + c + '}')}
            where id = \${id}
        `, user);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id: req.params.id });
        if (!user) throw new HttpError(req.t('MESSAGE.USER_NOT_FOUND'), 404);

        await db.none(`
            delete from users where id = \${id}
        `, user);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
