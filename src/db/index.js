const pgp = require('pg-promise')({
    receive({ data: rows }) {
        for (const [i, row] of rows.entries()) {
            rows[i] = Object.fromEntries(
                Object.entries(row).map(([column, value]) =>
                    [pgp.utils.camelize(column), value]
                )
            );
        }
    },
    error(err, event) {
        console.error(err);
        if (event.query) {
            console.error(event.query);
        }
        if (event.params) {
            console.error(event.params);
        }
    },
});

pgp.pg.types.setTypeParser(1700, parseFloat);

const db = pgp({
    connectionString: process.env.DB,
    statement_timeout: 10000,
    query_timeout: 10000,
});

module.exports = db;
