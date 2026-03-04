const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'record_id, record_type, record_line_id';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.recordId) {
            filters.push('record_id = ${recordId}');
            filterData.recordId = req.query.recordId;
        }

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.coatingLot) {
            filters.push('coating_lot = ${coatingLot}');
            filterData.coatingLot = req.query.coatingLot;
        }

        if (req.query.coatingDateFrom) {
            filters.push('coating_date >= ${coatingDateFrom}');
            filterData.coatingDateFrom = req.query.coatingDateFrom;
        }

        if (req.query.coatingDateTo) {
            filters.push('coating_date <= ${coatingDateTo}');
            filterData.coatingDateTo = req.query.coatingDateTo;
        }

        const coatingRecords = await db.any(`
            select ${field} from coating_records_sub
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(coatingRecords);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
