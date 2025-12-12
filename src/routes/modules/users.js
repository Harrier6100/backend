const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const HttpError = require('@/errors/HttpError');
const verifyToken = require('@/middlewares/verifyToken');
const requireRole = require('@/middlewares/requireRole');
const requirePermission = require('@/middlewares/requirePermission');
const Users = require('@/models/users');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const users = await Users.find().sort({ _id: 1 });
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) throw new HttpError(req.t('MESSAGE.USER_NOT_FOUND'), 404);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await Users.findById(req.body.id);
        if (exists) throw new HttpError(req.t('MESSAGE.USER_EXISTS'), 409);

        const user = new Users();
        user._id = req.body.id;
        user.name = req.body.name;
        user.password = await bcrypt.hash(req.body.id, 10);
        user.role = req.body.role;
        user.permissions = req.body.permissions;
        user.expiryDate = req.body.expiryDate;
        user.remarks = req.body.remarks;
        user.isActive = req.body.isActive;
        user.createdAt = new Date();
        user.createdBy = req.user.name;
        user.createdById = req.user.id;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;
        await user.save();

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) throw new HttpError(req.t('MESSAGE.USER_NOT_FOUND'), 404);

        user.name = req.body.name ?? user.name;
        user.role = req.body.role ?? user.role;
        user.permissions = req.body.permissions ?? user.permissions;
        user.expiryDate = req.body.expiryDate ?? user.expiryDate;
        user.remarks = req.body.remarks ?? user.remarks;
        user.isActive = req.body.isActive ?? user.isActive;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;
        await user.save();

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const user = await Users.findByIdAndDelete(req.params.id);
        if (!user) throw new HttpError(req.t('MESSAGE.USER_NOT_FOUND'), 404);

        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
