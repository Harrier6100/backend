const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const rateLimiter = require('@/middlewares/rateLimiter');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

const getCookieOptions = () => ({
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
});

const generateAccessToken = ({ id, name, roles, permissions }) => {
    return jsonwebtoken.sign(
        { id, name, roles, permissions },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '8h' }
    );
};

const generateRefreshToken = ({ id }) => {
    return jsonwebtoken.sign(
        { id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

const getRolesAndPermissions = async (id) => {
    const roles = await db.any(`
        select role_id from user_roles where user_id = \${id}
    `, { id });

    const permissions = await db.any(`
        select permission_id from user_permissions where user_id = \${id}
        union
        select role_permissions.permission_id from user_roles
            join role_permissions on role_permissions.role_id = user_roles.role_id
        where user_roles.user_id = \${id}
    `, { id });

    return {
        roles: roles.map(role => role.roleId),
        permissions: permissions.map(permission => permission.permissionId),
    };
};

const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken.verify(token, secret);
    } catch {
        throw new HttpError(401, 'invalid_token');
    }
};

router.post('/start', rateLimiter({ windowMs: 1000 * 60 * 15, max: 5 }), async (req, res) => {
    const { id, password } = req.body;

    const user = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id });
    if (!user || !password || !(await bcrypt.compare(password, user.password))) {
        throw new HttpError(401, 'invalid_credentials');
    }

    const { roles, permissions } = await getRolesAndPermissions(id);

    const accessToken = generateAccessToken({ id: user.id, name: user.name, roles, permissions });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.status(200).json({ token: accessToken });
});

router.post('/resume', async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) throw new HttpError(401, 'token_not_found');

    const { id } = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id });
    if (!user) throw new HttpError(401, 'invalid_token');

    const { roles, permissions } = await getRolesAndPermissions(id);

    const accessToken = generateAccessToken({ id: user.id, name: user.name, roles, permissions });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.status(200).json({ token: accessToken });
});

router.post('/end', (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(204);

    const { expires, ...cookieOptions } = getCookieOptions();
    res.clearCookie('refreshToken', cookieOptions);

    res.sendStatus(200);
});

module.exports = router;
