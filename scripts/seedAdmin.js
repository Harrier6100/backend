require('dotenv').config();
require('module-alias/register');
const bcrypt = require('bcrypt');
const db = require('@/db');

(async () => {
    const id = process.env.ADMIN_ID;
    const password = process.env.ADMIN_PASSWORD;

    const user = await db.oneOrNone('select id from users where id = ${id}', { id });
    if (user) {
        console.info('admin user already exists');
        process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.none(`
        insert into users (id, name, language, password, is_active, created_at, updated_at)
        values (\${id}, 'Admin', 'ja', \${password}, true, now(), now())
    `, { id, password: hashed });

    console.info('admin user seeded');
    process.exit(0);
})();
