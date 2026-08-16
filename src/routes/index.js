const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const modules = path.join(__dirname, 'modules');
const routes = (directory, route = '') => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            const nestedRoute = path.join(route, entry.name);
            routes(entryPath, nestedRoute);
        } else {
            const moduleName = path.basename(entry.name, '.js');
            const routePath = path.join(route, moduleName);
            router.use('/' + routePath, require(entryPath));
        }
    }
};
routes(modules);

module.exports = router;
