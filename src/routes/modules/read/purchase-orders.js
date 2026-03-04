const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'order_date, material_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.purchaseId) {
            filters.push('purchase_id = ${purchaseId}');
            filterData.purchaseId = req.query.purchaseId;
        }

        if (req.query.purchaseNumber) {
            filters.push('purchase_number = ${purchaseNumber}');
            filterData.purchaseNumber = req.query.purchaseNumber;
        }

        if (req.query.materialCode) {
            filters.push('material_code = ${materialCode}');
            filterData.materialCode = req.query.materialCode;
        }

        if (req.query.orderDateFrom) {
            filters.push('order_date >= ${orderDateFrom}');
            filterData.orderDateFrom = req.query.orderDateFrom;
        }

        if (req.query.orderDateTo) {
            filters.push('order_date <= ${orderDateTo}');
            filterData.orderDateTo = req.query.orderDateTo;
        }

        if (req.query.dueDateFrom) {
            filters.push('due_date >= ${dueDateFrom}');
            filterData.dueDateFrom = req.query.dueDateFrom;
        }

        if (req.query.dueDateTo) {
            filters.push('due_date <= ${dueDateTo}');
            filterData.dueDateTo = req.query.dueDateTo;
        }

        if (req.query.orderNumber) {
            filters.push('order_number = ${orderNumber}');
            filterData.orderNumber = req.query.orderNumber;
        }

        if (req.query.isInactiveDataIncluded !== 'true') {
            filters.push("status = '0'");
        }

        const purchaseOrders = await db.any(`
            select ${field} from purchase_orders
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(purchaseOrders);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'order_date, material_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.purchaseId) {
            filters.push('purchase_id like any (to_array(${purchaseId}))');
            filterData.purchaseId = req.query.purchaseId;
        }

        if (req.query.purchaseNumber) {
            filters.push('purchase_number like any (to_array(${purchaseNumber}))');
            filterData.purchaseNumber = req.query.purchaseNumber;
        }

        if (req.query.materialCode) {
            filters.push('material_code like any (to_array(${materialCode}))');
            filterData.materialCode = req.query.materialCode;
        }

        if (req.query.materialName) {
            filters.push('material_name like any (to_array(${materialName}))');
            filterData.materialName = req.query.materialName;
        }

        if (req.query.orderDateFrom) {
            filters.push('order_date >= ${orderDateFrom}');
            filterData.orderDateFrom = req.query.orderDateFrom;
        }

        if (req.query.orderDateTo) {
            filters.push('order_date <= ${orderDateTo}');
            filterData.orderDateTo = req.query.orderDateTo;
        }

        if (req.query.dueDateFrom) {
            filters.push('due_date >= ${dueDateFrom}');
            filterData.dueDateFrom = req.query.dueDateFrom;
        }

        if (req.query.dueDateTo) {
            filters.push('due_date <= ${dueDateTo}');
            filterData.dueDateTo = req.query.dueDateTo;
        }

        if (req.query.supplierCode) {
            filters.push('supplier_code like any (to_array(${supplierCode}))');
            filterData.supplierCode = req.query.supplierCode;
        }

        if (req.query.supplierName) {
            filters.push('supplier_name like any (to_array(${supplierName}))');
            filterData.supplierName = req.query.supplierName;
        }

        if (req.query.isInactiveDataIncluded !== 'true') {
            filters.push("status = '0'");
        }

        const purchaseOrders = await db.any(`
            select ${field} from purchase_orders
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(purchaseOrders);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
