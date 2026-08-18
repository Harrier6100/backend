const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

/*
 * permission
 * id: users.create
 * name: permission.users.create.name
 * description: permission.users.create.description
 */

router.get('/', verify(), async (req, res) => {
    const permissions = await db.any(`
        select * from permissions order by id
    `);

    res.status(200).json(permissions);
});

router.get('/:id', verify(), async (req, res) => {
    const permission = await db.oneOrNone(`
        select * from permissions where id = \${id}
    `, { id: req.params.id });
    if (!permission) throw new HttpError(404, 'permission_not_found');

    res.status(200).json(permission);
});

router.post('/', verify(), async (req, res) => {
    try {
        const permission = {};
        permission.id = req.body.id;
        permission.name = req.body.name;
        permission.description = req.body.description;
        permission.createdAt = new Date();
        permission.createdBy = req.user.name;
        permission.createdById = req.user.id;
        permission.updatedAt = new Date();
        permission.updatedBy = req.user.name;
        permission.updatedById = req.user.id;

        await db.none(`
            insert into permissions (${Object.keys(permission).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(permission).map(column => '${'+column+'}').join(', ')})
        `, permission);

        res.status(200).json(permission);
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'permission_already_exists');
        }
        throw err;
    }
});

router.put('/:id', verify(), async (req, res) => {
    const permission = await db.oneOrNone(`
        select * from permissions where id = \${id}
    `, { id: req.params.id });
    if (!permission) throw new HttpError(404, 'permission_not_found');

    permission.name = req.body.name;
    permission.description = req.body.description;
    permission.updatedAt = new Date();
    permission.updatedBy = req.user.name;
    permission.updatedById = req.user.id;

    await db.none(`
        update permissions set ${Object.keys(permission).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, permission);

    res.status(200).json(permission);
});

router.delete('/:id', verify(), async (req, res) => {
    const permission = await db.oneOrNone(`
        select * from permissions where id = \${id}
    `, { id: req.params.id });
    if (!permission) throw new HttpError(404, 'permission_not_found');

    await db.none(`
        delete from permissions where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(permission);
});

module.exports = router;
