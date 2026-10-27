const express = require('express');
const router = express.Router();
const verify = require('@/middlewares/verify');
const snakecase = require('@/helpers/snakecase');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

const getRequester = async (id) => {
    const requester = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id });

    return requester;
};

const resolveApprovers = async (step, instance) => {
    const approverIds = [];

    for (const approver of step.approvers) {
        if (approver.approverType === 'user') {
            approverIds.push(approver.approverId);
        } else if (approver.approverType === 'manager') {
            const requester = await getRequester(instance.requesterId);
            approverIds.push(requester.managerId);
        } else {
            throw new HttpError(500, '');
        }
    }

    return approverIds;
};

const isAuthorizedApprover = async (approverIds, actionApproverId) => {
    for (const approverId of approverIds) {
        if (String(approverId) === String(actionApproverId)) {
            return true;
        }

        const delegation = await db.oneOrNone(`
            select * from workflow_delegates
            where delegator_id = \${delegatorId}
                and delegate_id = \${delegateId}
                and start_date <= current_date
                and end_date >= current_date
                and deleted_at is null
        `, { delegatorId: approverId, delegateId: actionApproverId });

        if (delegation) {
            return true;
        }
    }

    return false;
};

// 申請リスト
router.get('/', verify(), async (req, res, next) => {
    try {
        const conditions = ['true'];
        const params = {};

        if (req.query.status) {
            conditions.push('status = \${status}');
            params.status = req.query.status;
        }

        if (req.query.isRequested) {
            conditions.push('requester_id = \${requesterId}');
            params.requesterId = req.user.id;
        }

        if (!req.query.isRequested) {
            conditions.push("(requester_id = \${requesterId} or visibility = 'public')");
            params.requesterId = req.user.id;
        }

        const instances = await db.any(`
            select * from workflow_instances
            where ${conditions.join(' and ')}
            order by created_at desc
        `, params);

        res.status(200).json(instances);
    } catch (err) {
        next(err);
    }
});

// 承認リスト
router.get('/approves', verify(), async (req, res, next) => {
    try {
        const instances = await db.any(`
            select * from workflow_instances
            where status = 'active'
        `);

        const approveList = [];
        for (const instance of instances) {
            const currentStep = instance.steps.find(
                step => step.order === instance.stepOrder
            );
            const approverIds = await resolveApprovers(currentStep, instance);
            if (await isAuthorizedApprover(approverIds, req.user.id)) {
                approveList.push(instance);
            }
        }

        res.status(200).json(approveList);
    } catch (err) {
        next(err);
    }
});

// 起票
router.post('/', verify(), async (req, res, next) => {
    try {
        const { templateId } = req.body;

        const template = await db.oneOrNone(`
            select * from workflow_templates
            where id = \${templateId}
        `, { templateId });
        if (!template) throw new HttpError(404, 'workflow_template_not_found');

        const instance = {};
        instance.templateId = req.body.templateId;
        instance.requesterId = req.user.id;
        instance.payload = req.body.payload;
        instance.visibility = template.visibility;
        instance.steps = JSON.stringify(template.steps);
        instance.createdAt = new Date();
        instance.createdBy = req.user.name;
        instance.createdById = req.user.id;
        instance.updatedAt = new Date();
        instance.updatedBy = req.user.name;
        instance.updatedById = req.user.id;

        await db.none(`
            insert into workflow_instances (${Object.keys(instance).map(column => snakecase(column))})
            values (${Object.keys(instance).map(column => '${' + column + '}')})
        `, instance);

        res.status(201).json(instance);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
