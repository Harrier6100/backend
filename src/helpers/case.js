const snakeize = (columns) => {
    if (Array.isArray(columns)) {
        return columns.map(column => column.replace(/([A-Z])/g, '_$1').toLowerCase());
    } else {
        return columns.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
};

module.exports = { snakeize };
