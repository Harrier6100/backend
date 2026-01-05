const express = require('express');
const router = express.Router();
const moment = require('moment');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const HttpError = require('@/errors/HttpError');
const { snakeize } = require('@/utils/case');
const db = require('@/config/db.postgres');

const generateAccessToken = ({ id, name, role, permissions }) => {
    return jsonwebtoken.sign(
        { id, name, role, permissions },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
    );
};

const generateRefreshToken = ({ id, name, role, permissions }) => {
    return jsonwebtoken.sign(
        { id, name, role, permissions },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

router.post('/login', async (req, res, next) => {
    const { id, password } = req.body;

    try {
        const user = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new HttpError(req.t('MESSAGE.API.AUTH_FAILED'), 401);
        }

        const expiryDate = moment(user.expiryDate).endOf('day');
        if (user.role === 'guest' && expiryDate.isBefore(moment())) {
            throw new HttpError(req.t('MESSAGE.API.AUTH_EXPIRED'), 401);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });

        res.status(200).json({ token: accessToken });
    } catch (err) {
        next(err);
    }
});

router.post('/auto/login', async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) throw new HttpError(req.t('MESSAGE.API.NO_TOKEN'), 401);

        const { id } = await new Promise((resolve, reject) => {
            jsonwebtoken.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                if (err) return reject(new HttpError(req.t('MESSAGE.API.INVALID_TOKEN'), 401));
                resolve(decoded);
            });
        });

        const user = await db.oneOrNone(`
            select * from users where id = \${id}
        `, { id });
        if (!user) throw new HttpError(req.t('MESSAGE.API.AUTH_FAILD'), 401);

        const expiryDate = moment(user.expiryDate).endOf('day');
        if (user.role === 'guest' && expiryDate.isBefore(moment())) {
            throw new HttpError(req.t('MESSAGE.API.AUTH_EXPIRED'), 401);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });

        res.status(200).json({ token: accessToken });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', (req, res, next) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(204);

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
    });

    res.sendStatus(204);
});

module.exports = router;
