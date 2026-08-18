const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

const strip = ({ password, ...user }) => user;

router.get('/', verify(), async (req, res) => {
    const users = await db.any(`
        select * from users order by id
    `);

    res.status(200).json(users.map(strip));
});

router.get('/:id', verify(), async (req, res) => {
    const user = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id: req.params.id === 'me' ? req.user.id : req.params.id });
    if (!user) throw new HttpError(404, 'user_not_found');

    res.status(200).json(strip(user));
});

router.get('/:id/roles', verify(), async (req, res) => {
    const roles = await db.any(`
        select roles.* from user_roles
            join roles on roles.id = user_roles.role_id
        where user_roles.user_id = \${id}
    `, { id: req.params.id });

    res.status(200).json(roles);
});

router.get('/:id/permissions', verify(), async (req, res) => {
    const permissions = await db.any(`
        select permissions.* from user_permissions
            join permissions on permissions.id = user_permissions.permission_id
        where user_permissions.user_id = \${id}
    `, { id: req.params.id });

    res.status(200).json(permissions);
});

router.post('/', verify(), async (req, res) => {
    try {
        const user = {};
        user.id = req.body.id;
        user.name = req.body.name;
        user.language = req.body.language;
        user.password = await bcrypt.hash(req.body.id, 10);
        user.remarks = req.body.remarks;
        user.isActive = req.body.isActive;
        user.createdAt = new Date();
        user.createdBy = req.user.name;
        user.createdById = req.user.id;
        user.updatedAt = new Date();
        user.updatedBy = req.user.name;
        user.updatedById = req.user.id;

        await db.none(`
            insert into users (${Object.keys(user).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(user).map(column => '${'+column+'}').join(', ')})
        `, user);

        res.status(200).json(strip(user));
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'user_already_exists');
        }
        throw err;
    }
});

router.put('/:id', verify(), async (req, res) => {
    const user = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id: req.params.id });
    if (!user) throw new HttpError(404, 'user_not_found');

    user.name = req.body.name;
    user.language = req.body.language;
    user.remarks = req.body.remarks;
    user.isActive = req.body.isActive;
    user.updatedAt = new Date();
    user.updatedBy = req.user.name;
    user.updatedById = req.user.id;

    await db.none(`
        update users set ${Object.keys(user).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, user);

    res.status(200).json(strip(user));
});

router.put('/:id/roles', verify(), async (req, res) => {
    const { roles } = req.body;

    const beforeRoles = await db.any(`
        select role_id from user_roles where user_id = \${id}
    `, { id: req.params.id });

    const roleIds = beforeRoles.map(role => role.roleId);
    const roleIdsToRemove = roleIds.filter(id => !roles.includes(id));
    const roleIdsToCreate = roles.filter(id => !roleIds.includes(id));

    await db.tx(async t => {
        if (roleIdsToRemove.length > 0) {
            await t.none(`
                delete from user_roles
                where user_id = \${id}
                    and role_id in (\${roleIdsToRemove:csv})
            `, { id: req.params.id, roleIdsToRemove });
        }

        if (roleIdsToCreate.length > 0) {
            for (const roleId of roleIdsToCreate) {
                const role = {};
                role.userId = req.params.id;
                role.roleId = roleId;
                role.createdAt = new Date();
                role.createdBy = req.user.name;
                role.createdById = req.user.id;
                role.updatedAt = new Date();
                role.updatedBy = req.user.name;
                role.updatedById = req.user.id;

                await t.none(`
                    insert into user_roles (${Object.keys(role).map(column => snakecase(column)).join(', ')})
                    values (${Object.keys(role).map(column => '${'+column+'}').join(', ')})
                `, role);
            }
        }
    });

    const afterRoles = await db.any(`
        select role_id from user_roles where user_id = \${id}
    `, { id: req.params.id });

    res.status(200).json({ roles: afterRoles.map(role => role.roleId) });
});

router.put('/:id/permissions', verify(), async (req, res) => {
    const { permissions } = req.body;

    const beforePermissions = await db.any(`
        select permission_id from user_permissions where user_id = \${id}
    `, { id: req.params.id });

    const permissionIds = beforePermissions.map(permission => permission.permissionId);
    const permissionIdsToRemove = permissionIds.filter(id => !permissions.includes(id));
    const permissionIdsToCreate = permissions.filter(id => !permissionIds.includes(id));

    await db.tx(async t => {
        if (permissionIdsToRemove.length > 0) {
            await t.none(`
                delete from user_permissions
                where user_id = \${id}
                    and permission_id in (\${permissionIdsToRemove:csv})
            `, { id: req.params.id, permissionIdsToRemove });
        }

        if (permissionIdsToCreate.length > 0) {
            for (const permissionId of permissionIdsToCreate) {
                const permission = {};
                permission.userId = req.params.id;
                permission.permissionId = permissionId;
                permission.createdAt = new Date();
                permission.createdBy = req.user.name;
                permission.createdById = req.user.id;
                permission.updatedAt = new Date();
                permission.updatedBy = req.user.name;
                permission.updatedById = req.user.id;

                await t.none(`
                    insert into user_permissions (${Object.keys(permission).map(column => snakecase(column)).join(', ')})
                    values (${Object.keys(permission).map(column => '${'+column+'}').join(', ')})
                `, permission);
            }
        }
    });

    const afterPermissions = await db.any(`
        select permission_id from user_permissions where user_id = \${id}
    `, { id: req.params.id });

    res.status(200).json({ permissions: afterPermissions.map(permission => permission.permissionId )});
});

router.delete('/:id', verify(), async (req, res) => {
    const user = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id: req.params.id });
    if (!user) throw new HttpError(404, 'user_not_found');

    await db.none(`
        delete from users where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(strip(user));
});

module.exports = router;
