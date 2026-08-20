const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.get('/', verify(), async (req, res) => {
    const permissions = await db.any(`
        select * from permissions
        order by
            split_part(id, '.', 1),
            case split_part(id, '.', 2)
                when 'read' then 1
                when 'create' then 2
                when 'update' then 3
                when 'delete' then 4
                else 5
            end
    `);

    res.status(200).json(permissions);
});

module.exports = router;
