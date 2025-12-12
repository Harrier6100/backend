const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const mongodb = require('./config/db.mongodb');

const nest = (obj, key, locale) => {
    if (!locale) return;

    const keys = key.split('.');
    let locales = obj;

    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            locales[key] = locale;
        } else {
            if (!locales[key]) locales[key] = {};
            locales = locales[key];
        }
    });
};

const main = async () => {
    try {
        await mongodb();

        const collection = mongoose.connection.db.collection('locales');
        const locales = await collection.find({}).toArray();

        const ja = {};
        const en = {};
        const ko = {};

        for (const locale of locales) {
            nest(ja, locale._id, locale.locales.ja);
            nest(en, locale._id, locale.locales.en);
            nest(ko, locale._id, locale.locales.ko);
        }

        fs.writeFileSync(path.join(__dirname, '../src/i18n/locales/ja.json'), JSON.stringify(ja, null, 2) + '\n', 'utf8');
        fs.writeFileSync(path.join(__dirname, '../src/i18n/locales/en.json'), JSON.stringify(en, null, 2) + '\n', 'utf8');
        fs.writeFileSync(path.join(__dirname, '../src/i18n/locales/ko.json'), JSON.stringify(ko, null, 2) + '\n', 'utf8');

        fs.writeFileSync(path.join(__dirname, '../../frontend/src/i18n/locales/ja.json'), JSON.stringify(ja, null, 2) + '\n', 'utf8');
        fs.writeFileSync(path.join(__dirname, '../../frontend/src/i18n/locales/en.json'), JSON.stringify(en, null, 2) + '\n', 'utf8');
        fs.writeFileSync(path.join(__dirname, '../../frontend/src/i18n/locales/ko.json'), JSON.stringify(ko, null, 2) + '\n', 'utf8');

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
main();
