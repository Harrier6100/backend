const express = require('express');
const router = express.Router();
const moment = require('moment');
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code, barcode_lot';

        const filters = ['1=1'];
        const filterData = {};

        if (req.query.productCode) {
            filters.push('product_code = ${productCode}');
            filterData.productCode = req.query.productCode;
        }

        if (req.query.stockLot) {
            filters.push('stock_lot = ${stockLot}');
            filterData.stockLot = req.query.stockLot;
        }

        if (req.query.isOutOfStockIncluded !== 'true') {
            filters.push('stock_qty != 0');
        }

        const wiproductStocks = await db.any(`
            select ${field} from wiproduct_stocks
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        res.status(200).json(wiproductStocks);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code, barcode_lot';

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

        if (req.query.stockLot) {
            filters.push('stock_lot like any (to_array(${stockLot}))');
            filterData.stockLot = req.query.stockLot;
        }

        if (req.query.stockWidth) {
            filters.push('stock_width = ${stockWidth}');
            filterData.stockWidth = req.query.stockWidth;
        }

        if (req.query.stockLength) {
            filters.push('stock_length = ${stockLength}');
            filterData.stockLength = req.query.stockLength;
        }

        if (req.query.warehouseCode) {
            filters.push('warehouse_code like any (to_array(${warehouseCode}))');
            filterData.warehouseCode = req.query.warehouseCode;
        }

        if (req.query.stockType) {
            filters.push('stock_type like any (to_array(${stockType}))');
            filterData.stockType = req.query.stockType;
        }

        if (req.query.stockStatus) {
            filters.push('stock_status like any (to_array(${stockStatus}))');
            filterData.stockStatus = req.query.stockStatus;
        }

        if (req.query.receiveDateFrom) {
            filters.push('receive_date >= ${receiveDateFrom}');
            filterData.receiveDateFrom = req.query.receiveDateFrom;
        }

        if (req.query.receiveDateTo) {
            filters.push('receive_date <= ${receiveDateTo}');
            filterData.receiveDateTo = req.query.receiveDateTo;
        }

        if (req.query.isOutOfStockIncluded !== 'true') {
            filters.push('stock_qty != 0');
        }

        const wiproductStocks = await db.any(`
            select ${field} from wiproduct_stocks
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        for (const index in wiproductStocks) {
            const wiproductStock = wiproductStocks[index];

            const { productCode } = wiproductStock;

            const physpropSpec = await db.oneOrNone(`
                select * from physprop_specs_kn
                where product_code = concat(translate(left(\${productCode}, 1), '56789', '01234'), substr(\${productCode}, 2, 8))
                    and property_code = 'A_ZD__'
                    and customer_code = ''
            `, { productCode });

            let expiryDate = '';
            if (physpropSpec) {
                expiryDate = moment(wiproductStock.coatingDate).add(physpropSpec.propertySpec3, 'M').format('YYYYMMDD');
            }
            wiproductStock.expiryDate = expiryDate;

            wiproductStocks[index] = wiproductStock;
        }

        res.status(200).json(wiproductStocks);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
