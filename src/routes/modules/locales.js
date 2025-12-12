const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const verifyToken = require('@/middlewares/verifyToken');
const requireRole = require('@/middlewares/requireRole');
const requirePermission = require('@/middlewares/requirePermission');
const Locales = require('@/models/locales');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const locales = await Locales.find().sort({ _id: 1 });
        res.status(200).json(locales);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await Locales.findById(req.params.id);
        if (!locale) throw new HttpError(req.t('MESSAGE.LOCALE_NOT_FOUND'), 404);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const exists = await Locales.findById(req.body.id);
        if (exists) throw new HttpError(req.t('MESSAGE.LOCALE_EXISTS'), 409);

        const locale = new Locales();
        locale._id = req.body.id;
        locale.locales = req.body.locales,
        locale.createdAt = new Date();
        locale.createdBy = req.user.name;
        locale.createdById = req.user.id;
        locale.updatedAt = new Date();
        locale.updatedBy = req.user.name;
        locale.updatedById = req.user.id;
        await locale.save();

        res.status(201).json(locale);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await Locales.findById(req.params.id);
        if (!locale) throw new HttpError(req.t('MESSAGE.LOCALE_NOT_FOUND'), 404);

        locale.locales = req.body.locales ?? locale.locales;
        locale.updatedAt = new Date();
        locale.updatedBy = req.user.name;
        locale.updatedById = req.user.id;
        await locale.save();

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const locale = await Locales.findByIdAndDelete(req.params.id);
        if (!locale) throw new HttpError(req.t('MESSAGE.LOCALE_NOT_FOUND'), 404);

        res.status(200).json(locale);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
