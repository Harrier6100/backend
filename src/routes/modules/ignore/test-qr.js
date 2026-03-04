const express = require('express');
const router = express.Router();
const moment = require('moment');
const iconv = require('iconv-lite');
const { spawn } = require('child_process');
const HttpError = require('@/errors/HttpError');
const db = require('@/db');

router.post('/', async (req, res, next) => {
    try {
        const { data } = req.body;
        const timestamp = moment().format('YYYY-MM-DD HH:mm');

        let command = '';
        for (const order of data.slice(1, 2)) {
            const { productName, coatingLot, testName, hum, testDate, testType, remarks } = order;

            const { productCode } = await db.oneOrNone(`
                select product_code from coating_lot_records
                where coating_lot = \${coatingLot}
            `, { coatingLot })

            const { testCode } = await db.oneOrNone(`
                select * from physprop_specs_kn
                where product_code = codec(\${productCode})
                    and test_name ~* ('^' || \${testName})
                    and customer_code = ''
            `, { productCode, testName });

             if (testCode) {
                command += `
                    ^XA
                    ^MUM,300,300
                    ^CWJ,B:HOTHIC.FNT
                    ^SEB:JIS.DAT
                    ^PR2,8,8
                    ^LH0,0
                    ^PON
                    ^BY0.2,3,8
                    ^PQ1^FS
                    ^CI12
                    ^FO50,0^MUD,300,300^BQN,2,6^FH^FDKA,_09_09_09_09${productName}_20NENCHAKU_09${coatingLot}_09_09_09_09_09_09_09_09_09_09${productCode}_09_${encode(testCode)}_09^FS
                    ^MUM,300,300
                    ^CI15
                    ^FO10,7^AJ,3,3^FH^FD_${encode(productName)}^FS
                    ^FO10,10^AJ,3,3^FH^FD_${encode(coatingLot)}^FS
                    ^FO10,15^AJ,3,3^FH^FD_${encode(testName)}^FS
                    ^FO10,18^AJ,3,3^FH^FD_${encode(testCode)}^FS
                    ^FO10,23^AJ,3,3^FH^FD_${encode(testDate)}^FS
                    ^FO30,23^AJ,3,3^FH^FD_${encode(testType)}^FS
                    ^FO10,26^AJ,3,3^FH^FD_${encode(remarks)}^FS
                    ^FO50,28^AJ,2,2^FH^FD_${encode(timestamp)}^FS
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
