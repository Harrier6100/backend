const express = require('express');
const router = express.Router();
const HttpError = require('@/errors/HttpError');
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const { orderNumber } = req.query;

        const order = await db.oneOrNone(`
            select * from orders
            where order_number = \${orderNumber}
                and status != 'H'
        `, { orderNumber });

        if (!order) {
            throw new HttpError('order_is_not_found', 404);
        }

        const recipient = await db.oneOrNone(`
            select * from customers
            where customer_code = \${recipientCode}
        `, { recipientCode: order.recipientCode });

        if (!recipient) {
            throw new HttpError('recipient_is_not_found', 404);
        }

        const shippingPlan = await db.oneOrNone(`
            select * from shipping_plans
            where order_number = \${orderNumber}
                and shipping_date >= \${shippingDate}
                and status != 'C'
        `, { orderNumber: order.orderNumber, shippingDate: order.shippingDate });

        if (!shippingPlan) {
            throw new HttpError('shipping_plan_is_not_found', 404);
        }

        const shippingRecords = await db.result(`
            select distinct
                record_id, sum(shipping_qty) over (partition by plan_id) as shipping_qty
            from shipping_records
            where plan_id = \${planId}
                and status = '1'
        `, { planId: shippingPlan.planId });

        if (shippingRecords.rowCount === 0) {
            throw new HttpError('shipping_records_is_not_found', 404);
        }

        const shipping = {
            shippingQty: Number(shippingRecords.rows[0].shippingQty),
            cartonQty: Number(shippingRecords.rowCount),
        };

        res.status(200).json({ order, recipient, shipping });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
