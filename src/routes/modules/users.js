const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { snakeize } = require('@/utils/case');
const db = require('@/config/db');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const users = await db.any(`
            select * from crud.users order by id
        `);

        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
});

router.get('/me', verifyToken, async (req, res, next) => {
    try {
        const user = await db.oneOrNone(`
            select * from crud.users where id = \${id}
        `, { id: req.user.id });
        if (!user) throw new HttpError('ERROR.USER_NOT_FOUND', 404);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await db.oneOrNone(`
            select * from crud.users where id = \${id}
        `, { id: req.params.id });
        if (!user) throw new HttpError('ERROR.USER_NOT_FOUND', 404);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await db.oneOrNone(`
            select * from crud.users where id = \${id}
        `, { id: req.body.id });
        if (exists) throw new HttpError('ERROR.USER_ALREADY_EXISTS', 409);

        const user = {};
        user.id = req.body.id;
        user.name = req.body.name;
        user.language = req.body.language;
        user.password = await bcrypt.hash(req.body.id, 10);
        user.role = req.body.role;
        user.permissions = req.body.permissions;
        user.expiryDate = req.body.expiryDate || null;
        user.remarks = req.body.remarks;
        user.isActive = req.body.isActive;
        user.createdAt = new Date();
        user.createdBy = req.user.name;
        user.createdById = req.user.id;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;

        await db.none(`
            insert into crud.users (${snakeize(Object.keys(user))})
            values (${Object.keys(user).map(column => '${' + column + '}')})
        `, user);

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await db.oneOrNone(`
            select * from crud.users where id = \${id}
        `, { id: req.params.id });
        if (!user) throw new HttpError('ERROR.USER_NOT_FOUND', 404);

        user.name = req.body.name;
        user.language = req.body.language;
        user.role = req.body.role;
        user.permissions = req.body.permissions;
        user.expiryDate = req.body.expiryDate || null;
        user.remarks = req.body.remarks;
        user.isActive = req.body.isActive;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;

        await db.none(`
            update crud.users set ${Object.keys(user).map(column => snakeize(column) + ' = ${' + column + '}')}
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
            select * from crud.users where id = \${id}
        `, { id: req.params.id });
        if (!user) throw new HttpError('ERROR.USER_NOT_FOUND', 404);

        await db.none(`
            delete from crud.users where id = \${id}
        `, user);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
