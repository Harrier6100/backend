const net = require('net');
const iconv = require('iconv-lite');
const moment = require('moment');

const jobexec = (mem, sysin) => {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setEncoding('hex');
        socket.setTimeout(3000);
        socket.connect(6680, 'nfsrv01.gs.lintec.co.jp');

        socket.on('connect', () => {
            let command = `ｼﾞｮﾌﾞﾏｸﾛ \\ AFJOBEX2 MEM=${mem}`;
            if (sysin) command += `,SYSIN=${sysin}`;
            command = iconv.encode(command, 'sjis');
            socket.end(command);
        });

        socket.on('close', () => resolve());
        socket.on('timeout', () => reject(new Error('Timeout.')));
        socket.on('error', (err) => reject(err));
    });
};

module.exports = jobexec;
