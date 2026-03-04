const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*, sum(transaction_net_qty) over (partition by barcode_lot order by transaction_id) as transaction_net_qty';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'transaction_id';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.materialCode) {
            filters.push('material_code = ${materialCode}');
            filterData.materialCode = req.query.materialCode;
        }

        if (req.query.stockLot) {
            filters.push('stock_lot = ${stockLot}');
            filterData.stockLot = req.query.stockLot;
        }

        if (req.query.transactionDateFrom) {
            filters.push('transaction_date >= ${transactionDateFrom}');
            filterData.transactionDateFrom = req.query.transactionDateFrom;
        }

        if (req.query.transactionDateTo) {
            filters.push('transaction_date <= ${transactionDateTo}');
            filterData.transactionDateTo = req.query.transactionDateTo;
        }

        if (req.query.transactionType) {
            filters.push('transaction_type = ${transactionType}');
            filterData.transactionType = req.query.transactionType;
        }

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.isMoveDataIncluded !== 'true') {
            filters.push("transaction_type != '2'");
        }

        const materialTransactions = await db.any(`
            select ${field} from material_transactions
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(materialTransactions);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*, sum(transaction_net_qty) over (partition by barcode_lot order by transaction_id) as transaction_net_qty';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'transaction_id';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.materialCode) {
            filters.push('material_code like any (to_array(${materialCode}))');
            filterData.materialCode = req.query.materialCode;
        }

        if (req.query.materialName) {
            filters.push('material_name like any (to_array(${materialName}))');
            filterData.materialName = req.query.materialName;
        }

        if (req.query.stockLot) {
            filters.push('stock_lot like any (to_array(${stockLot}))');
            filterData.stockLot = req.query.stockLot;
        }

        if (req.query.transactionDateFrom) {
            filters.push('transaction_date >= ${transactionDateFrom}');
            filterData.transactionDateFrom = req.query.transactionDateFrom;
        }

        if (req.query.transactionDateTo) {
            filters.push('transaction_date <= ${transactionDateTo}');
            filterData.transactionDateTo = req.query.transactionDateTo;
        }

        if (req.query.transactionType) {
            filters.push('transaction_type = ${transactionType}');
            filterData.transactionType = req.query.transactionType;
        }

        if (req.query.machineCode) {
            filters.push('machine_code like any (to_array(${machineCode}))');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.planNumber) {
            filters.push('plan_number like any (to_array(${planNumber}))');
            filterData.planNumber = req.query.planNumber;
        }

        if (req.query.processCode) {
            filters.push('process_code like any (to_array(${processCode}))');
            filterData.processCode = req.query.processCode;
        }

        if (req.query.processLot) {
            filters.push('process_lot like any (to_array(${processLot}))');
            filterData.processLot = req.query.processLot;
        }

        if (req.query.systemDateFrom) {
            filters.push('system_date >= ${systemDateFrom}');
            filterData.systemDateFrom = req.query.systemDateFrom;
        }

        if (req.query.systemDateTo) {
            filters.push('system_date <= ${systemDateTo}');
            filterData.systemDateTo = req.query.systemDateTo;
        }

        if (req.query.wsName) {
            filters.push('ws_name like any (to_array(${wsName}))');
            filterData.wsName = req.query.wsName;
        }

        if (req.query.isMoveDataIncluded !== 'true') {
            filters.push("transaction_type != '2'");
        }

        const materialTransactions = await db.any(`
            select ${field} from material_transactions
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(materialTransactions);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
