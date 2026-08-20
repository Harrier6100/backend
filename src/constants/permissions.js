const RESOURCES = [
    'users',
    'roles',
    'permissions',
    'locales',
];

const ACTIONS = [
    'read',
    'create',
    'update',
    'delete',
];

const PERMISSIONS = RESOURCES.flatMap(resource => {
    return ACTIONS.map(action => `${resource}.${action}`);
});

module.exports = { RESOURCES, ACTIONS, PERMISSIONS };
