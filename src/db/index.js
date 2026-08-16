const pgp = require('pg-promise')({
    receive({ data }) {
        data.forEach((row, i) => {
            data[i] = Object.fromEntries(
                Object.entries(row).map(([c, v]) => [pgp.utils.camelize(c), v])
            );
        });
    },
    error(err, e) {
        console.error(err);
        if (e.query) {
            console.error(e.query);
        }
        if (e.params) {
            console.error(e.params);
        }
    }
});

pgp.pg.types.setTypeParser(1700, parseFloat);

const db = pgp({
    connectionString: process.env.DB,
    statement_timeout: 10000,
    query_timeout: 10000,
});

module.exports = db;
