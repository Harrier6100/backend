const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.get('/', verify(), async (req, res, next) => {
    try {
        const templates = await db.any(`
            select * from workflow_templates
        `);

        res.status(200).json(templates);
    } catch (err) {
        next(err);
    }
});

router.post('/', verify(), async (req, res, next) => {
    try {
        const template = {};
        template.name = req.body.name;
        template.steps = req.body.steps;
        template.visibility = req.body.visibility;
        template.createdAt = new Date();
        template.createdBy = req.user.name;
        template.createdById = req.user.id;
        template.updatedAt = new Date();
        template.updatedBy = req.user.name;
        template.updatedById = req.user.id;

        await db.none(`
            insert into workflow_templates (${Object.keys(template).map(column => snakecase(column))})
            values (${Object.keys(template).map(column => '${' + column + '}')})
        `, template);

        res.status(201).json(template);
    } catch (err) {
        if (err.code === '23505') {
            return next(new HttpError(409, 'workflow_template_already_exists'));
        }
        next(err);
    }
});

router.put('/:id', verify(), async (req, res, next) => {
    try {
        const template = await db.oneOrNone(`
            select * from workflow_templates where id = \${id}
        `, { id: req.params.id });
        if (!template) throw new HttpError(404, 'workflow_template_not_found');

        template.name = req.body.name;
        template.visibility = req.body.visibility;
        template.steps = req.body.steps;
        template.updatedAt = new Date();
        template.updatedBy = req.user.name;
        template.updatedById = req.user.id;

        await db.none(`
            update workflow_templates set ${Object.keys(template).map(column => snakecase(column) + ' = ${' + column + '}')}
            where id = \${id}
        `, template);

        res.status(200).json(template);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verify(), async (req, res, next) => {
    try {
        const template = await db.oneOrNone(`
            select * from workflow_templates where id = \${id}
        `, { id: req.params.id });
        if (!template) throw new HttpError(404, 'workflow_template_not_found');

        await db.none(`
            delete from workflow_templates where id = \${id}
        `, { id: req.params.id });

        res.status(200).json(template);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
