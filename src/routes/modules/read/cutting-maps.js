const express = require('express');
const router = express.Router();
const db = require('@/db');

const CF_MACHINES = ['KNC7', 'KNC9'];

router.get('/', async (req, res, next) => {
    try {
        const { lot } = req.query;

        const cuttingRecords = await db.any(`
            select * from cutting_records
            where record_type != 'A'
                and material_lot = \${lot}
            order by record_id desc, record_line_id, cutting_number
        `, { lot });

        const maps = [];

        let recordId;
        for (const cuttingRecord of cuttingRecords) {
            if (cuttingRecord.recordId !== recordId) {
                const groupings = cuttingRecords.filter(record => {
                    return cuttingRecord.recordId === record.recordId;
                });

                for (const index in groupings) {
                    const grouping = groupings[index];

                    const traces = await db.any(`
                        select * from traces
                        where before_lot = \${cuttingLot}
                    `, { cuttingLot: grouping.cuttingLot });

                    for (const trace of traces) {
                        grouping.afterLot = trace.afterLot;
                    }

                    groupings[index] = grouping;
                }

                if (CF_MACHINES.includes(cuttingRecord.machineCode)) {
                    const cuttingPlan = await db.oneOrNone(`
                        select * from cutting_plans
                        where plan_id = \${planId}
                    `, { planId: cuttingRecord.planId });

                    if (cuttingPlan) {
                        const count = Math.ceil(groupings.length / cuttingPlan.lineCount);
                        const records = new Array(count).fill().map((_, i) =>
                            groupings.slice(i * cuttingPlan.lineCount, (i + 1) * cuttingPlan.lineCount)
                        );
                        maps.push(...records);
                    }
                } else {
                    maps.push(groupings);
                }


                recordId = cuttingRecord.recordId;
            }
        }

        res.status(200).json(maps);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
