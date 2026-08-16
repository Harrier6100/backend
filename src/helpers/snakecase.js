const snakecase = (column) => {
    return column.replace(/([A-Z])/g, '_$1').toLowerCase();
};

module.exports = snakecase;
