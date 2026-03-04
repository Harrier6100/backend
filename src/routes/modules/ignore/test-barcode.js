const express = require('express');
const router = express.Router();
const iconv = require('iconv-lite');
const { spawn } = require('child_process');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.post('/a', async (req, res, next) => {
    try {
        const { coatingLot, coatingDateFrom, coatingDateTo, machineCode, printQty } = req.body;

        const filters = ['1=1'];
        const filterData = {};

        if (coatingLot) {
            filters.push('coating_lot in (${coatingLot:csv})');
            filterData.coatingLot = coatingLot.trim().split(/\s+/);
        }

        if (coatingDateFrom) {
            filters.push('coating_date >= ${coatingDateFrom}');
            filterData.coatingDateFrom = coatingDateFrom;
        }

        if (coatingDateTo) {
            filters.push('coating_date <= ${coatingDateTo}');
            filterData.coatingDateTo = coatingDateTo;
        }

        if (machineCode && machineCode.length) {
            filters.push('machine_code in (${machineCode:csv})');
            filterData.machineCode = machineCode;
        }

        const coatingLotRecords = await db.any(`
            select product_name, coating_lot from coating_lot_records
            where ${filters.join(' and ')}
            order by coating_date, machine_code, coating_lot
        `, filterData);

        if (coatingLotRecords.length === 0) {
            throw new HttpError('PRINT_DATA_IS_NONE', 404);
        }

        let command = '';
        for (const { productName, coatingLot } of coatingLotRecords) {
            const productNameEncoded = encode(productName);
            const coatingLotEncoded = encode(coatingLot);

            for (let p=0; p<printQty; p++) {
                command += `
                    ^XA
                    ^MUM,300,300
                    ^CWJ,B:GOTHIC.FNT
                    ^SEB:JIS.DAT
                    ^PR2,8,8
                    ^LH0,0
                    ^PON
                    ^BY0.2,3,8
                    ^PQ1^FS
                    ^CI15
                    ^FO67,6^AJR,4,2^FH^FD_${productNameEncoded}^FS
                    ^FO63,6^A0R,3,4^FH^FD_${coatingLotEncoded}^FS
                    ^FO59,6^BCR,4,N,N,N^FD${coatingLot}^FS
                    ^FO50,6^AJR,4,2^FH^FD_${productNameEncoded}^FS
                    ^FO46,6^A0R,3,4^FH^FD_${coatingLotEncoded}^FS
                    ^FO42,6^BCR,4,N,N,N^FD${coatingLot}^FS
                    ^FO33,6^AJR,4,2^FH^FD_${productNameEncoded}^FS
                    ^FO29,6^A0R,3,4^FH^FD_${coatingLotEncoded}^FS
                    ^FO25,6^BCR,4,N,N,N^FD${coatingLot}^FS
                    ^FO16,6^AJR,4,2^FH^FD_${productNameEncoded}^FS
                    ^FO12,6^A0R,3,4^FH^FD_${coatingLotEncoded}^FS
                    ^FO08,6^BCR,4,N,N,N^FD${coatingLot}^FS
                    ^XZ
                `;
            }
        }

        await print(command);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

router.post('/b', async (req, res, next) => {
    try {
        const { coatingLot, coatingDateFrom, coatingDateTo, machineCode, printQty } = req.body;

        const filters = ['1=1'];
        const filterData = {};

        if (coatingLot) {
            filters.push('coating_lot in (${coatingLot:csv})');
            filterData.coatingLot = coatingLot.trim().split(/\s+/);
        }

        if (coatingDateFrom) {
            filters.push('coating_date >= ${coatingDateFrom}');
            filterData.coatingDateFrom = coatingDateFrom;
        }

        if (coatingDateTo) {
            filters.push('coating_date <= ${coatingDateTo}');
            filterData.coatingDateTo = coatingDateTo;
        }

        if (machineCode && machineCode.length) {
            filters.push('machine_code in (${machineCode:csv})');
            filterData.machineCode = machineCode;
        }

        const coatingLotRecords = await db.any(`
            select product_name, coating_lot from coating_lot_records
            where ${filters.join(' and ')}
            order by coating_date, machine_code, coating_lot
        `, filterData);

        if (coatingLotRecords.length === 0) {
            throw new HttpError('PRINT_DATA_IS_NONE', 404);
        }

        let command = '';
        for (const { productName, coatingLot } of coatingLotRecords) {
            const productNameEncoded = encode(productName);
            const coatingLotEncoded = encode(coatingLot);

            for (let p=0; p<printQty; p++) {
                command += `
                    ^XA
                    ^MUM,300,300
                    ^CWJ,B:GOTHIC.FNT
                    ^SEB:JIS.DAT
                    ^PR2,8,8
                    ^LH0,0
                    ^PON
                    ^BY0.2,3,8
                    ^PQ1^FS
                    ^CI15
                    ^FO10,12.0^AJ,5,4^FH^FD_${productNameEncoded}^FS
                    ^FO10,20.0^A0,5,5^FH^FD_${coatingLotEncoded}^FS
                    ^FO40,19.5^BCN,5,N,N,N^FD${coatingLot}^FS
                    ^XZ
                `;
                if (printQty > 1 && printQty == (p + 1)) {
                    command += `
                        ^XA
                        ^MUM,300,300
                        ^CWJ,B:GOTHIC.FNT
                        ^SEB:JIS.DAT
                        ^PR2,8,8
                        ^LH0,0
                        ^PON
                        ^BY0.2,3,8
                        ^PQ1^FS
                        ^CI15
                        ^FO33,12^A0,12,9^FDDS^FS
                        ^XZ
                    `;
                }
            }
        }

        await print(command);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

router.post('/c', async (req, res, next) => {
    try {
        const { text, fontSize, positionX, positionY, printQty } = req.body;
        const textEncoded = encode(text);

        let command = '';
        for (let p=0; p<printQty; p++) {
            command += `
                ^XA
                ^MUM,300,300
                ^CWJ,B:GOTHIC.FNT
                ^SEB:JIS.DAT
                ^PR2,8,8
                ^LH0,0
                ^PON
                ^BY0.2,3,8
                ^PQ1^FS
                ^CI15
                ^FO${positionX},${positionY}
                ^AJ,${fontSize},${fontSize}
                ^FH^FD_${textEncoded}^FS
                ^XZ
            `;
        }

        await print(command);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

router.post('/d', async (req, res, next) => {
    try {
        const { text, printQty } = req.body;

        const textEncoded = new Array(5).fill('');
        for (const index in textEncoded) {
            if (text[index]) {
                textEncoded[index] = encode(text[index]);
            }
        }

        let command = '';
        for (let p=0; p<printQty; p++) {
            command += `
                ^XA
                ^MUM,300,300
                ^CWJ,B:GOTHIC.FNT
                ^SEB:JIS.DAT
                ^PR2,8,8
                ^LH0,0
                ^PON
                ^BY0.2,3,8
                ^PQ1^FS
                ^CI15
                ^FO9,06.5^AJ,3,3^FH^FD_${textEncoded[0]}^FS
                ^FO9,11.5^AJ,3,3^FH^FD_${textEncoded[1]}^FS
                ^FO9,16.5^AJ,3,3^FH^FD_${textEncoded[2]}^FS
                ^FO9,21.5^AJ,3,3^FH^FD_${textEncoded[3]}^FS
                ^FO9,26.5^AJ,3,3^FH^FD_${textEncoded[4]}^FS
                ^XZ
            `;
        }

        await print(command);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

const encode = (str) => {
    if (!str) return '';
    return Buffer.from(iconv.encode(str, 'sjis')).toString('hex').match(/.{2}/g).join('_');
};

const print = (data) => {
    return new Promise((resolve, reject) => {
        const lpr = spawn('lpr', ['-P', '192.168.19.61']);

        lpr.once('error', reject);
        lpr.once('close', (code) =>
            code === 0 ? resolve() : reject(new Error('Printer failed.'))
        );

        lpr.stdin.end(data);
    });
};

module.exports = router;
