const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const snakecase = require('@/helpers/snakecase');
const db = require('@/db')();

/**
 * status
 * active 進行中
 * returned 差し戻し
 * approved 承認
 * rejected 却下
 */

const getUser = async (id) => {
    const user = await db.oneOrNone(`
        select * from users where id = \${id}
    `, { id });

    return user;
};

const resolveApprovers = async (step, instance) => {
    const approverIds = [];

    for (const approver of step.approvers) {
        if (approver.approverType === 'user') {
            approverIds.push(approver.approverId);
        } else if (approver.approverType === 'manager') {
            const requester = await getUser(instance.requesterId);
            approverIds.push(requester.managerId);
        } else {
            throw new HttpError(500, '未対応の承認タイプ');
        }
    }

    return approverIds;
};

const isAuthorizedApprover = async (expectedApproverIds, actionApproverId) => {
    for (const expectedApproverId of expectedApproverIds) {
        if (String(expectedApproverId) === String(actionApproverId)) {
            return true;
        }

        const delegation = await db.oneOrNone(`
            select * from workflow_delegates
            where delegator_id = \${delegatorId}
                and delegate_id = \${delegateId}
                and start_date <= current_date
                and end_date >= current_date
                and deleted_at is null
        `, { delegatorId: expectedApproverId, delegateId: actionApproverId });

        if (delegation) {
            return true;
        }
    }

    return false;
};

const findMatchedApproverId = async (expectedApproverIds, actingApproverId) => {
    for (const expectedApproverId of expectedApproverIds) {
        if (String(expectedApproverId) === String(actingApproverId)) {
            return null;
        }

        const delegation = await db.oneOrNone(`
            select * from workflow_delegates
            where delegator_id = \${delegatorId}
                and delegate_id = \${delegateId}
                and start_date <= current_date
                and end_date >= current_date
                and deleted_at is null
        `, { delegatorId: expectedApproverId, delegateId: actingApproverId });

        if (delegation) {
            return expectedApproverId;
        }
    }

    return undefined;
};

// テンプレート一覧
router.get('/templates', async (req, res, next) => {
    try {
        const templates = await db.any(`
            select * from workflow_templates;
        `);

        res.status(200).json(templates);
    } catch (err) {
        next(err);
    }
});

// テンプレート作成
router.post('/templates', async (req, res, next) => {
    try {
        const { name, steps } = req.body;

        const template = {
            name,
            steps,
        };

        await db.none(`
            insert into workflow_templates (${Object.keys(template).map(column => snakecase(column))})
            values (${Object.keys(template).map(column => '${' + column + '}')})
        `, template);

        res.status(200).json(template);
    } catch (err) {
        next(err);
    }
});

// 申請一覧
router.get('/instances/requested/:requesterId', async (req, res, next) => {
    try {
        const { requesterId } = req.params;
        const { status } = req.query;

        const instances = status
            ? await db.any(`
                select * from workflow_instances
                where requester_id = \${requesterId} and status = \${status}
                order by created_at desc
            `, { requesterId, status })
            : await db.any(`
                select * from workflow_instances
                where requester_id = \${requesterId}
                order by created_at desc
            `, { requesterId });

        res.status(200).json(instances);
    } catch (err) {
        next(err);
    }
});

// 起票
router.post('/instances', async (req, res, next) => {
    try {
        const { templateId, requesterId, payload } = req.body;

        const template = await db.oneOrNone(`
            select * from workflow_templates
            where id = \${templateId}
        `, { templateId });
        if (!template) throw new HttpError(404, 'workflow_template_not_found');

        const instance = {
            templateId,
            requesterId,
            payload,
            steps: JSON.stringify(template.steps),
        };

        await db.none(`
            insert into workflow_instances (${Object.keys(instance).map(column => snakecase(column))})
            values (${Object.keys(instance).map(column => '${' + column + '}')})
        `, instance);

        res.status(200).json(instance);
    } catch (err) {
        next(err);
    }
});

// 再提出
router.post('/instances/:id/resubmit', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { requesterId, payload } = req.body;

        const instance = await db.oneOrNone(`
            select * from workflow_instances
            where id = \${id}
                and requester_id = \${requesterId}
        `, { id, requesterId });
        if (!instance) throw new HttpError(404, 'workflow_instance_not_found');

        if (instance.status !== 'returned') {
            throw new HttpError(409, 'workflow_instance_not_returned');
        }

        await db.none(`
            update workflow_instances set status = 'active', payload = \${payload}
            where id = \${id}
        `, { id, payload });

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// 承認一覧
router.get('/instances/pending/:approverId', async (req, res, next) => {
    try {
        const { approverId } = req.params;

        const instances = await db.any(`
            select * from workflow_instances
            where status = 'active'
        `);

        const pending = [];
        for (const instance of instances) {
            const currentStep = instance.steps.find(
                step => step.order === instance.stepOrder
            );
            const expectedApproverIds = await resolveApprovers(currentStep, instance);
            if (await isAuthorizedApprover(expectedApproverIds, approverId)) {
                pending.push(instance);
            }
        }

        res.status(200).json(pending);
    } catch (err) {
        next(err);
    }
});

// 承認
router.post('/instances/:id/approve', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { approverId, remarks } = req.body;

        const instance = await db.oneOrNone(`
            select * from workflow_instances where id = \${id}
        `, { id });
        if (!instance) throw new HttpError(404, 'workflow_instance_not_found');

        if (instance.status !== 'active') {
            throw new HttpError(409, 'workflow_instance_not_active');
        }

        const currentStep = instance.steps.find(
            step => step.order === instance.stepOrder
        );
        if (!currentStep) throw new HttpError(409, 'workflow_step_not_found');

        const expectedApproverIds = await resolveApprovers(currentStep, instance);
        const authorized = await isAuthorizedApprover(expectedApproverIds, approverId);
        if (!authorized) {
            throw new HttpError(403, 'not_authorized_approver');
        }

        const actedAsId = await findMatchedApproverId(expectedApproverIds, approverId);

        const action = {
            instanceId: id,
            stepOrder: instance.stepOrder,
            approverId,
            actedAsId,
            action: 'approved',
            remarks,
        };

        await db.none(`
            insert into workflow_actions (${Object.keys(action).map(column => snakecase(column))})
            values (${Object.keys(action).map(column => '${' + column + '}')})
        `, action);

        const nextStep = instance.steps.find(
            step => step.order === instance.stepOrder + 1
        );

        if (nextStep) {
            await db.none(`
                update workflow_instances set step_order = \${order}
                where id = \${id}
            `, { order: nextStep.order, id });
        } else {
            await db.none(`
                update workflow_instances set status = 'approved'
                where id = \${id}
            `, { id });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// 却下
router.post('/instances/:id/reject', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { approverId, remarks } = req.body;

        const instance = await db.oneOrNone(`
            select * from workflow_instances where id = \${id}
        `, { id });
        if (!instance) throw new HttpError(404, 'workflow_instance_not_found');

        if (instance.status !== 'active') {
            throw new HttpError(409, 'workflow_instance_not_active');
        }

        const currentStep = instance.steps.find(
            step => step.order === instance.stepOrder
        );
        if (!currentStep) throw new HttpError(409, 'workflow_step_not_found');

        const expectedApproverIds= await resolveApprovers(currentStep, instance);
        const authorized = await isAuthorizedApprover(expectedApproverIds, approverId);
        if (!authorized) {
            throw new HttpError(403, 'not_authorized_approver');
        }

        const actedAsId = await findMatchedApproverId(expectedApproverIds, approverId);

        const action = {
            instanceId: id,
            stepOrder: instance.stepOrder,
            approverId,
            actedAsId,
            action: 'rejected',
            remarks,
        };

        await db.none(`
            insert into workflow_actions (${Object.keys(action).map(column => snakecase(column))})
            values (${Object.keys(action).map(column => '${' + column + '}')})
        `, action);

        await db.none(`
            update workflow_instances set status = 'rejected'
            where id = \${id}
        `, { id });

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// 差し戻し
router.post('/instances/:id/return', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { approverId, remarks } = req.body;

        const instance = await db.oneOrNone(`
            select * from workflow_instances where id = \${id}
        `, { id });
        if (!instance) throw new HttpError(404, 'workflow_instance_not_found');

        if (instance.status !== 'active') {
            throw new HttpError(409, 'workflow_instance_not_active');
        }

        const currentStep = instance.steps.find(
            step => step.order === instance.stepOrder
        );
        if (!currentStep) throw new HttpError(409, 'workflow_step_not_found');

        const expectedApproverIds = await resolveApprovers(currentStep, instance);
        const authorized = await isAuthorizedApprover(expectedApproverIds, approverId);
        if (!authorized) {
            throw new HttpError(403, 'not_authorized_approver');
        }

        const actedAsId = await findMatchedApproverId(expectedApproverIds, approverId);

        const action = {
            instanceId: id,
            stepOrder: instance.stepOrder,
            approverId,
            actedAsId,
            action: 'returned',
            remarks,
        };

        await db.none(`
            insert into workflow_actions (${Object.keys(action).map(column => snakecase(column))})
            values (${Object.keys(action).map(column => '${' + column + '}')})
        `, action);

        await db.none(`
            update workflow_instances set status = 'returned'
            where id = \${id}
        `, { id });

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// 履歴
router.get('/instances/:id/history', async (req, res, next) => {
    try {
        const { id } = req.params;

        const actions = await db.any(`
            select * from workflow_actions
            where instance_id = \${id}
            order by acted_at asc
        `, { id });

        res.status(200).json(actions);
    } catch (err) {
        next(err);
    }
});

// 委任登録
router.post('/delegates', async (req, res, next) => {
    try {
        const { delegatorId, delegateId, startDate, endDate } = req.body;

        if (new Date(startDate) > new Date(endDate)) {
            throw new HttpError(400, 'invalid_date_range');
        }

        const delegate = {
            delegatorId,
            delegateId,
            startDate,
            endDate,
        };

        await db.none(`
            insert into workflow_delegates (${Object.keys(delegate).map(column => snakecase(column))})
            values (${Object.keys(delegate).map(column => '${' + column + '}')})
        `, delegate);

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// 委任登録解除
router.put('/delegates/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { delegatorId } = req.body;

        const delegate = await db.oneOrNone(`
            select * from workflow_delegates where id = \${id}
        `, { id });
        if (!delegate) throw new HttpError(404, 'workflow_delegate_not_found');

        if (String(delegate.delegatorId) !== String(delegatorId)) {
            throw new HttpError(403, 'not_authorized_delegator');
        }

        await db.none(`
            update workflow_delegates set deleted_at = now()
            where id = \${id}
        `, { id });

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
