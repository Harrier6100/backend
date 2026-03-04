const express = require('express');
const router = express.Router();
const { snakeize } = require('@/helpers/case');
const db = require('@/db');

router.get('/', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code, stock_lot';

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

        if (req.query.parentLot) {
            filters.push('parent_lot = ${parentLot}');
            filterData.parentLot = req.query.parentLot;
        }

        if (req.query.isOutOfStockIncluded !== 'true') {
            filters.push('stock_qty != 0');
        }

        const productLotStocks = await db.any(`
            select ${field} from product_lot_stocks
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        for (const index in productLotStocks) {
            const productLotStock = productLotStocks[index];

            const { parentLot } = productLotStock;

            const wiproductStock = await db.oneOrNone(`
                select * from wiproduct_stocks
                where stock_lot = \${parentLot}
            `, { parentLot });

            productLotStock.remarks = wiproductStock?.remarks ?? '';

            productLotStocks[index] = productLotStock;
        }

        res.status(200).json(productLotStocks);
    } catch (err) {
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const field = req.query.field ? snakeize(req.query.field) : '*';
        const sort = req.query.sort ? snakeize(req.query.sort) : 'product_code, stock_lot';

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

        if (req.query.previousLot) {
            filters.push('previous_lot like any (to_array(${previousLot}))');
            filterData.previousLot = req.query.previousLot;
        }

        if (req.query.parentLot) {
            filters.push(/[%_,]/.test(req.query.parentLot)
                ? 'parent_lot like any (to_array(${parentLot}))'
                : 'parent_lot = ${parentLot}'
            );
            filterData.parentLot = req.query.parentLot;
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

        if (req.query.printCode) {
            filters.push('print_code like any (to_array(${printCode}))');
            filterData.printCode = req.query.printCode;
        }

        if (req.query.stockType) {
            filters.push('stock_type like any (to_array(${stockType}))');
            filterData.stockType = req.query.stockType;
        }

        if (req.query.stockStatus) {
            filters.push('stock_status like any (to_array(${stockStatus}))');
            filterData.stockStatus = req.query.stockStatus;
        }

        if (req.query.cuttingDateFrom) {
            filters.push('cutting_date >= ${cuttingDateFrom}');
            filterData.cuttingDateFrom = req.query.cuttingDateFrom;
        }

        if (req.query.cuttingDateTo) {
            filters.push('cutting_date <= ${cuttingDateTo}');
            filterData.cuttingDateTo = req.query.cuttingDateTo;
        }

        if (req.query.rpNumber) {
            filters.push('rp_number like any (to_array(${rpNumber}))');
            filterData.rpNumber = req.query.rpNumber;
        }

        if (req.query.isOutOfStockIncluded !== 'true') {
            filters.push("stock_qty != 0");
        }

        const productLotStocks = await db.any(`
            select ${field} from product_lot_stocks
            where ${filters.join(' and ')}
            order by ${sort}
        `, filterData);

        for (const index in productLotStocks) {
            const productLotStock = productLotStocks[index];

            const { parentLot } = productLotStock;

            const wiproductStock = await db.oneOrNone(`
                select * from wiproduct_stocks
                where stock_lot = \${parentLot}
            `, { parentLot });

            productLotStock.remarks = wiproductStock?.remarks ?? '';

            productLotStocks[index] = productLotStock;
        }

        res.status(200).json(productLotStocks);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
