const express = require('express');
const router = express.Router();
const fs = require('fs');
const winrm = require('nodejs-winrm');
const HttpError = require('@/errors/HttpError');

const WINRM_CONFIG = {
    server: '192.168.10.34',
    user: 'winrm',
    password: 'lintec',
    port: 5985,
};

const runWinrm = (command) => {
    const { server, user, password, port } = WINRM_CONFIG;
    return winrm.runCommand(command, server, user, password, port);
};

const jobschprint = async (jobnet) => {
    const command = 'C:\\Systemwalker\\MPWALKER.JM\\BIN\\jobschprint -n -long';
    const statusList = await runWinrm(command);

    const statusListLines = statusList.split(/\r?\n/);
    const jobstatus = statusListLines.filter(line => line.includes(jobnet)).pop();

    if (!jobstatus) return false;
    return jobstatus.includes('Normal');
};

const jobschcontrol = async (jobnet) => {
    const command = `C:\\Systemwalker\\MPWALKER.JM\\BIN\\jobschcontrol.exe WebService/${jobnet} start`;
    await runWinrm(command);
};

const jobwatch = (statusFile) => {
    return new Promise((resolve, reject) => {
        const startTime = new Date();

        const interval = setInterval(() => {
            try {
                const stats = fs.statSync(statusFile);
                if (stats.mtime > startTime) {
                    clearInterval(interval);

                    const status = fs.readFileSync(statusFile, 'utf8');
                    if (status.includes('OK')) return resolve();
                    if (status.includes('NG')) return reject();
                }
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    clearInterval(interval);
                    reject(err);
                }
            }
        }, 1000);
    });
};

router.post('/', async (req, res, next) => {
    try {
        const { jobnet, isInterval, statusFile } = req.body;

        const jobstatus = await jobschprint(jobnet);
        if (!jobstatus) {
            throw new HttpError('job_is_running', 409);
        }

        await jobschcontrol(jobnet);

        if (isInterval) {
            await jobwatch(statusFile);
        }

        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
