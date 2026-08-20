require('dotenv').config();
require('module-alias/register');
const bcrypt = require('bcrypt');
const db = require('@/db');
const { RESOURCES, ACTIONS } = require('@/constants/permissions');

(async () => {
    const id = process.env.ADMIN_ID;
    const password = process.env.ADMIN_PASSWORD;

    await db.tx(async t => {
        const user = await t.oneOrNone('select id from users where id = \${id}', { id });
        if (!user) {
            const hashed = await bcrypt.hash(password, 10);
            await t.none(`
                insert into users (id, name, language, password, is_active, created_at, created_by, created_by_id, updated_at, updated_by, updated_by_id)
                values (\${id}, 'Admin', 'ja', \${password}, true, now(), 'system', 'system', now(), 'system', 'system')
            `, { id, password: hashed });
        }

        await t.none(`
            insert into roles (id, name, description, created_at, created_by, created_by_id, updated_at, updated_by, updated_by_id)
            values ('admin', 'Admin', 'Admin', now(), 'system', 'system', now(), 'system', 'system')
            on conflict (id) do nothing
        `);

        for (const resource of RESOURCES) {
            for (const action of ACTIONS) {
                const permissionId = `${resource}.${action}`;
                await t.none(`
                    insert into permissions (id, created_at, created_by, created_by_id, updated_at, updated_by, updated_by_id)
                    values (\${permissionId}, now(), 'system', 'system', now(), 'system', 'system')
                    on conflict (id) do nothing
                `, { permissionId });

                await t.none(`
                    insert into role_permissions (role_id, permission_id, created_at, created_by, created_by_id, updated_at, updated_by, updated_by_id)
                    values ('admin', \${permissionId}, now(), 'system', 'system', now(), 'system', 'system')
                    on conflict (role_id, permission_id) do nothing
                `, { permissionId });
            }
        }

        await t.none(`
            insert into user_roles (user_id, role_id, created_at, created_by, created_by_id, updated_at, updated_by, updated_by_id)
            values (\${id}, 'admin', now(), 'system', 'system', now(), 'system', 'system')
            on conflict (user_id, role_id) do nothing
        `, { id });
    });

    console.info('admin user seeded');
    process.exit(0);
})();
