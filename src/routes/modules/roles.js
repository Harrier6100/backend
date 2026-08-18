const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

/*
 * role
 * id: admin
 * name: role.admin.name
 * decription: role.admin.description
 *
 *            --- サービス全体の管理者
 * org.*      --- 組織（テナント）単位
 * team.*     --- 組織内のチーム/部門単位
 * group.*    --- 組織内のグループ単位
 */

router.get('/', verify(), async (req, res) => {
    const roles = await db.any(`
        select * from roles order by id
    `);

    res.status(200).json(roles);
});

router.get('/:id', verify(), async (req, res) => {
    const role = await db.oneOrNone(`
        select * from roles where id = \${id}
    `, { id: req.params.id });
    if (!role) throw new HttpError(404, 'role_not_found');

    res.status(200).json(role);
});

router.get('/:id/permissions', verify(), async (req, res) => {
    const permissions = await db.any(`
        select permissions.* from role_permissions
            join permissions on permissions.id = role_permissions.permission_id
        where role_permissions.role_id = \${id}
    `, { id: req.params.id });

    res.status(200).json(permissions);
});

router.post('/', verify(), async (req, res) => {
    try {
        const role = {};
        role.id = req.body.id;
        role.name = req.body.name;
        role.description = req.body.description;
        role.createdAt = new Date();
        role.createdBy = req.user.name;
        role.createdById = req.user.id;
        role.updatedAt = new Date();
        role.updatedBy = req.user.name;
        role.updatedById = req.user.id;

        await db.none(`
            insert into roles (${Object.keys(role).map(column => snakecase(column)).join(', ')})
            values (${Object.keys(role).map(column => '${'+column+'}').join(', ')})
        `, role);

        res.status(200).json(role);
    } catch (err) {
        if (err.code === '23505') {
            throw new HttpError(409, 'role_already_exists');
        }
        throw err;
    }
});

router.put('/:id', verify(), async (req, res) => {
    const role = await db.oneOrNone(`
        select * from roles where id = \${id}
    `, { id: req.params.id });
    if (!role) throw new HttpError(404, 'role_not_found');

    role.name = req.body.name;
    role.description = req.body.description;
    role.updatedAt = new Date();
    role.updatedBy = req.user.name;
    role.updatedById = req.user.id;

    await db.none(`
        update roles set ${Object.keys(role).map(column => snakecase(column) + ' = ${'+column+'}').join(', ')}
        where id = \${id}
    `, role);

    res.status(200).json(role);
});

router.put('/:id/permissions', verify(), async (req, res) => {
    const { permissions } = req.body;

    const beforePermissions = await db.any(`
        select permission_id from role_permissions where role_id = \${id}
    `, { id: req.params.id });

    const permissionIds = beforePermissions.map(permission => permission.permissionId);
    const permissionIdsToRemove = permissionIds.filter(id => !permissions.includes(id));
    const permissionIdsToCreate = permissions.filter(id => !permissionIds.includes(id));

    await db.tx(async t => {
        if (permissionIdsToRemove.length > 0) {
            await t.none(`
                delete from role_permissions
                where role_id = \${id}
                    and permission_id in (\${permissionIdsToRemove:csv})
            `, { id: req.params.id, permissionIdsToRemove });
        }

        if (permissionIdsToCreate.length > 0) {
            for (const permissionId of permissionIdsToCreate) {
                const permission = {};
                permission.roleId = req.params.id;
                permission.permissionId = permissionId;
                permission.createdAt = new Date();
                permission.createdBy = req.user.name;
                permission.createdById = req.user.id;
                permission.updatedAt = new Date();
                permission.updatedBy = req.user.name;
                permission.updatedById = req.user.id;

                await t.none(`
                    insert into role_permissions (${Object.keys(permission).map(column => snakecase(column)).join(', ')})
                    values (${Object.keys(permission).map(column => '${'+column+'}').join(', ')})
                `, permission);
            }
        }
    });

    const afterPermissions = await db.any(`
        select permission_id from role_permissions where role_id = \${id}
    `, { id: req.params.id });

    res.status(200).json({ permissions: afterPermissions.map(permission => permission.permissionId )});
});

router.delete('/:id', verify(), async (req, res) => {
    const role = await db.oneOrNone(`
        select * from roles where id = \${id}
    `, { id: req.params.id });
    if (!role) throw new HttpError(404, 'role_not_found');

    await db.none(`
        delete from roles where id = \${id}
    `, { id: req.params.id });

    res.status(200).json(role);
});

module.exports = router;
