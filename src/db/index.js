const pgp = require('pg-promise')({
    receive({ data }) {
        if (!data.length) return;
        data.forEach((row, i) => {
            data[i] = Object.fromEntries(
                Object.entries(row).map(([column, value]) =>
                    [pgp.utils.camelize(column), value]
                )
            );
        });
    }
});

const types = pgp.pg.types;
types.setTypeParser(1700, (value) => parseFloat(value));
const db = pgp(process.env.DB);

module.exports = db;
