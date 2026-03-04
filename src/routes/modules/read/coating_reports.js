const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'coating_date, machine_code, product_code';

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

        if (req.query.coatingDateFrom) {
            filters.push('coating_date >= ${coatingDateFrom}');
            filterData.coatingDateFrom = req.query.coatingDateFrom;
        }

        if (req.query.coatingDateTo) {
            filters.push('coating_date <= ${coatingDateTo}');
            filterData.coatingDateTo = req.query.coatingDateTo;
        }

        const reports = await db.any(`
            with
            unions as (
                select coating_date, machine_code, machine_name, product_code from coating_reports union
                select coating_date, machine_code, machine_name, material_code from coating_bs_reports where substr(material_code, 1, 1) >= '5' union
                select coating_date, machine_code, machine_name, material_code from coating_sp_reports where substr(material_code, 1, 1) >= '5' union
                select coating_date, machine_code, machine_name, material_code from coating_ma_reports where substr(material_code, 1, 1) >= '5'
            ),
            reports as (
                select distinct
                    unions.coating_date as coating_date,
                    unions.machine_code as machine_code,
                    unions.machine_name as machine_name,
                    unions.product_code as product_code,
                    items.product_name as product_name,
                    coalesce(coating_reports.coating_sqm_qty, 0) as coating_sqm_qty,
                    coalesce(coating_bs_reports.issue_sqm_qty, 0) as bs_issue_sqm_qty,
                    coalesce(round((coating_reports.coating_sqm_qty / nullif(coating_bs_reports.issue_sqm_qty, 0)) * 100, 2), 0) as bs_yield,
                    coalesce(coating_sp_reports.issue_sqm_qty, 0) as sp_issue_sqm_qty,
                    coalesce(round((coating_reports.coating_sqm_qty / nullif(coating_sp_reports.issue_sqm_qty, 0)) * 100, 2), 0) as sp_yield,
                    coalesce(coating_reports.coating_kg_qty, 0) as coating_kg_qty,
                    coalesce(coating_ma_reports.issue_kg_qty, 0) as issue_kg_qty,
                    coalesce(round((coating_reports.coating_kg_qty / nullif(coating_ma_reports.issue_kg_qty, 0)) * 100, 2), 0) as yield,
                    coalesce(coating_reports.process_time_1, 0) as process_time_1,
                    coalesce(coating_reports.process_time_2, 0) as process_time_2,
                    coalesce(coating_reports.process_time_3, 0) as process_time_3,
                    coalesce(coating_reports.process_time_4, 0) as process_time_4,
                    coalesce(coating_reports.process_time_5, 0) as process_time_5,
                    coalesce(coating_reports.process_time_6, 0) as process_time_6,
                    coalesce(coating_reports.process_time_7, 0) as process_time_7,
                    coalesce(round(coating_reports.coating_qty / nullif(coating_reports.process_time_1, 0), 2), 0) as speed,
                    coalesce(round((coating_reports.process_time_1 / nullif(coating_reports.process_time_1 + coating_reports.process_time_2, 0)) * 100, 2), 0) as rate
                from unions
                    left join coating_reports on coating_reports.coating_date = unions.coating_date and coating_reports.machine_code = unions.machine_code and coating_reports.product_code = unions.product_code
                    left join coating_bs_reports on coating_bs_reports.coating_date = unions.coating_date and coating_bs_reports.machine_code = unions.machine_code and coating_bs_reports.material_code = unions.product_code
                    left join coating_sp_reports on coating_sp_reports.coating_date = unions.coating_date and coating_sp_reports.machine_code = unions.machine_code and coating_sp_reports.material_code = unions.product_code
                    left join coating_ma_reports on coating_ma_reports.coating_date = unions.coating_date and coating_ma_reports.machine_code = unions.machine_code and coating_ma_reports.material_code = unions.product_code
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
