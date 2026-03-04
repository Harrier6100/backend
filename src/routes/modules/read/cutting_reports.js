const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'cutting_date, machine_code, product_code';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.machineCode) {
            filters.push('machine_code = ${machineCode}');
            filterData.machineCode = req.query.machineCode;
        }

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.cuttingDateFrom) {
            filters.push('cutting_date >= ${cuttingDateFrom}');
            filterData.cuttingDateFrom = req.query.cuttingDateFrom;
        }

        if (req.query.cuttingDateTo) {
            filters.push('cutting_date <= ${cuttingDateTo}');
            filterData.cuttingDateTo = req.query.cuttingDateTo;
        }

        const reports = await db.any(`
            with
            unions as (
                select cutting_date, machine_code, machine_name, product_code from cutting_reports union
                select cutting_date, machine_code, machine_name, material_code from cutting_ma_reports where substr(material_code, 1, 1) < '5'
            ),
            reports as (
                select distinct
                    unions.cutting_date as cutting_date,
                    unions.machine_code as machine_code,
                    unions.machine_name as machine_name,
                    unions.product_code as product_code,
                    items.product_name as product_name,
                    coalesce(cutting_reports.cutting_sqm_qty, 0) as cutting_sqm_qty,
                    coalesce(cutting_ma_reports.issue_sqm_qty, 0) as issue_sqm_qty,
                    coalesce(round((cutting_reports.cutting_sqm_qty / nullif(cutting_ma_reports.issue_sqm_qty, 0)) * 100, 2), 0) as yield,
                    coalesce(cutting_ma_reports.issue_net_sqm_qty, 0) as issue_net_sqm_qty,
                    coalesce(round((cutting_ma_reports.issue_net_sqm_qty / nullif(cutting_ma_reports.issue_sqm_qty, 0)) * 100, 2), 0) as net_yield,
                    coalesce(cutting_ma_reports.issue_qty, 0) as issue_qty,
                    coalesce(cutting_ma_reports.issue_net_qty, 0) as issue_net_qty,
                    coalesce(cutting_ma_reports.process_time_1, 0) as process_time_1,
                    coalesce(cutting_ma_reports.process_time_2, 0) as process_time_2,
                    coalesce(cutting_ma_reports.process_time_3, 0) as process_time_3,
                    coalesce(cutting_ma_reports.process_time_4, 0) as process_time_4,
                    coalesce(cutting_ma_reports.process_time_5, 0) as process_time_5,
                    coalesce(cutting_ma_reports.process_time_6, 0) as process_time_6,
                    coalesce(cutting_ma_reports.process_time_7, 0) as process_time_7,
                    coalesce(round(cutting_reports.cutting_sqm_qty / nullif(cutting_ma_reports.process_time_1, 0), 2), 0) as speed,
                    coalesce(round((cutting_ma_reports.process_time_1 / nullif(cutting_ma_reports.process_time_1 + cutting_ma_reports.process_time_2, 0)) * 100, 2), 0) as rate
                from unions
                    left join cutting_reports on cutting_reports.cutting_date = unions.cutting_date and cutting_reports.machine_code = unions.machine_code and cutting_reports.product_code = unions.product_code
                    left join cutting_ma_reports on cutting_ma_reports.cutting_date = unions.cutting_date and cutting_ma_reports.machine_code = unions.machine_code and cutting_ma_reports.material_code = unions.product_code
                    left join items on items.product_code = left(unions.product_code, 9)
            )
            select ${field} from reports
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(reports);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
