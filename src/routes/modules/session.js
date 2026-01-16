const express = require('express');
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const moment = require('moment');
const db = require('@/config/db');

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

router.post('/start', async (req, res, next) => {
    try {
        const { id, password } = req.body;

        const user = await db.oneOrNone(`
            select * from crud.users where id = \${id}
        `, { id });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new HttpError('ERROR.INVALID_CREDENTIALS', 401);
        }

        const expiryDate = moment(user.expiryDate).endOf('day');
        if (user.role === 'guest' && expiryDate.isBefore(moment())) {
            throw new HttpError('ERROR.USER_EXPIRED', 401);
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

router.post('/auto/start', async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) throw new HttpError('', 401);

        const { id } = await new Promise((resolve, reject) => {
            jsonwebtoken.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                if (err) return reject();
                resolve(decoded);
            });
        });

        const user = await db.oneOrNone(`
            select * from crud.users where id = \${id}
        `, { id });
        if (!user) throw new HttpError('ERROR.TOKEN_INVALID', 401);

        const expiryDate = moment(user.expiryDate).endOf('day');
        if (user.role === 'guest' && expiryDate.isBefore(moment())) {
            throw new HttpError('ERROR.USER_EXPIRED', 401);
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

router.post('/end', async (req, res, next) => {
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
