const path = require('path');
const fs = require('fs');

const locales = {};
['ja', 'en', 'ko'].forEach(locale => {
    const message = path.join(__dirname, 'locales', locale + '.json');
    locales[locale] = JSON.parse(fs.readFileSync(message, 'utf8'));
});

const getNestedMessage = (message, key) => {
    return key.split('.').reduce((msg, key) => msg?.[key], message);
};

const resolveReferences = (message, locale, visited = new Set()) => {
    if (typeof message !== 'string') return message;

    return message.replace(/\{\{([\w.]+)\}\}/g, (_, refKey) => {
        if (visited.has(refKey)) return `{{${refKey}}}`;

        visited.add(refKey);
        const refMessage = getNestedMessage(locales[locale], refKey);
        return resolveReferences(refMessage || `{{${refKey}}}`, locale, visited);
    });
};

const i18n = (req, res, next) => {
    const locale = req.headers['accept-language']?.startsWith('en') ? 'en' : 'ja';
    req.locale = locale;

    req.t = (key) => {
        const msg = getNestedMessage(locales[locale], key) || key;
        return resolveReferences(msg, locale);
    };

    next();
};

module.exports = i18n;
