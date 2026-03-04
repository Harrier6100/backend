const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : "substr(test_lot, 8, 2), test_lot, physprop_code, test_number, case test_number when '091' then 2 else 1 end";

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.testLot) {
            filters.push('test_lot = ${testLot}');
            filterData.testLot = req.query.testLot;
        }

        const physpropValues = await db.any(`
            select ${field} from physprop_values_kn
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(physpropValues);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakecase(req.query.field) : '*';
        const sort = req.query.sort ? snakecase(req.query.sort) : "substr(test_lot, 8, 2), test_lot, test_code, test_number, case test_number when '091' then 2 else 1 end";

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.productCode) {
            filters.push('product_code like any (to_array(${productCode}))');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.productName) {
            filters.push('product_name like any (to_array(${productName}))');
            filterData.productName = req.query.productName;
        }

        if (req.query.testLot) {
            filters.push(/[%_,]/.test(req.query.testLot)
                ? 'test_lot like any (to_array(${testLot}))'
                : 'test_lot = ${testLot}'
            );
            filterData.testLot = req.query.testLot;
        }

        if (req.query.testDateFrom) {
            filters.push('test_date >= ${testDateFrom}');
            filterData.testDateFrom = req.query.testDateFrom;
        }

        if (req.query.testDateTo) {
            filters.push('test_date <= ${testDateTo}');
            filterData.testDateTo = req.query.testDateTo;
        }

        if (req.query.testCode) {
            filters.push('test_code like any (to_array(${testCode}))');
            filterData.testCode = req.query.testCode;
        }

        if (req.query.testName) {
            filters.push('test_name like any (to_array(${testName}))');
            filterData.testName = req.query.testName;
        }

        if (req.query.testedById) {
            filters.push('tested_by_id like any (to_array(${testedById}))');
            filterData.testedById = req.query.testedById;
        }

        if (req.query.testedBy) {
            filters.push('tested_by like any (to_array(${testedBy}))');
            filterData.testedBy = req.query.testedBy;
        }

        if (req.query.updatedDateFrom) {
            filters.push('updated_date >= ${updatedDateFrom}');
            filterData.updatedDateFrom = req.query.updatedDateFrom;
        }

        if (req.query.updatedDateTo) {
            filters.push('updated_date <= ${updatedDateTo}');
            filterData.updatedDateTo = req.query.updatedDateTo;
        }

        if (req.query.isOutOfSpecOnly === 'true') {
            filters.push("score != '0'");
        }

        if (req.query.isMeanDataOnly === 'true') {
            filters.push("test_number = '091'");
        }

        if (req.query.isDateMismatchOnly === 'true') {
            filters.push('test_date != updated_date');
        }

        const physpropValues = await db.any(`
            select ${field} from physprop_values_kn
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        for (const index in physpropValues) {
            const physpropValue = physpropValues[index];

            const { factoryCode, productCode, testCode } = physpropValue;

            const physpropSpec = await db.oneOrNone(`
                select * from physprop_specs_kn
                where product_code = \${productCode}
                    and case when (substr(\${testCode}, 1, 4) = 'A_AB')
                            then test_code = replace(\${testCode}, 'AB', 'A')
                            else test_code = \${testCode}
                        end
                    and customer_code = ''
            `, { factoryCode, productCode, testCode });

            physpropValue.spec = physpropSpec ?? {};

            physpropValues[index] = physpropValue;
        }

        res.status(200).json(physpropValues);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
