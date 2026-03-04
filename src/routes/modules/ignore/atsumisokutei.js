const express = require('express');
const router = express.Router();
const moment = require('moment');
const fs = require('fs');
const jobexec = require('@/helpers/jobexec');

router.post('/', async (req, res, next) => {
    try {
        const { data } = req.body;

        const timestamp = moment();
        const createDate = timestamp.format('YYYYMMDD');
        const createTime = timestamp.format('HHmmssSS');
        const id = String(Date.now());

        for (const key in data) {
            const { testDate, testedById, testLot, propertyValues } = data[key];

            for (const propertyCode in propertyValues) {
                for (const [i, propertyValue] of propertyValues[propertyCode].entries()) {
                    const testNumber = ((i + 1) === propertyValues[propertyCode].length) ? 91 : (i + 1);
                    const text = [
                        'KN', '', testLot, propertyCode.split('_').join('\t'),
                        '', testNumber, propertyValue, testDate, testedById,
                        '', '', createDate, createTime
                    ].join('\t') + '\n';
                    fs.appendFileSync(`/srv/storage/qcs/${id}.TXT`, text);
                }
            }
        }

        await jobexec('AFQCS020', `FILE(${id})`);

        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
