const snakeize = (keys) => {
    if (Array.isArray(keys)) {
        return keys.map(key =>
            key.replace(/([A-Z])/g, '_$1').toLowerCase()
        );
    } else {
        return keys.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
};

module.exports = { snakeize };
