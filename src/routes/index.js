const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const modules = path.join(__dirname, 'modules');
const routes = (directory, route = '') => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of sortedEntries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            const newRoute = path.join(route, entry.name);
            routes(absolute, newRoute);
        } else {
            if (path.basename(entry.name).charAt(0) !== '_') {
                const basename = path.basename(entry.name, '.js');
                const routePath = path.join(route, ...basename.split('_'));
                const routeHandler = require(absolute);
                router.use('/' + routePath, routeHandler);
            }
        }
    }
};
routes(modules);

module.exports = router;
