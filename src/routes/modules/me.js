const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const verifyToken = require('@/middlewares/verifyToken');
const Users = require('@/models/users');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const user = await Users.findById(req.user.id);
        if (!user) throw new HttpError(req.t('MESSAGE.USER_IS_NOT_FOUND'), 404);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const user = await Users.findById(req.user.id);
        if (!user) throw new HttpError(req.t('MESSAGE.USER_IS_NOT_FOUND'), 404);

        user.name = req.body.name ?? user.name;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;
        await user.save();

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
