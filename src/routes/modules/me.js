const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const { verifyToken } = require('@/middlewares');
const { snakeize } = require('@/utils/case');
const db = require('@/config/db.postgres');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const me = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id: req.user.id });
        if (!me) throw new HttpError(req.t('MESSAGE.USER_IS_NOT_FOUND'), 404);

        res.status(200).json(me);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const me = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id: req.user.id });
        if (!me) throw new HttpError(req.t('MESSAGE.USER_IS_NOT_FOUND'), 404);

        me.name = req.body.name ?? me.name;
        me.updatedAt = new Date();
        me.updatedBy = req.user.name;
        me.updatedById = req.user.id;

        await db.none(`
            update users set ${Object.keys(me).map(c => snakeize(c) + ' = ${' + c + '}')}
            where id = \${id}
        `, me);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
