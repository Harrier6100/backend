const mongoose = require('mongoose');

const localeSchema = new mongoose.Schema({
    _id: String,
    locales: {
        type: Map,
        of: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: Date,
    createdBy: String,
    createdById: String,
    updatedAt: Date,
    updatedBy: String,
    updatedById: String,
}, {
    id: true,
    versionKey: false,
    toJSON: { virtuals: true },
});

const Locales = mongoose.model('Locales', localeSchema);

module.exports = Locales;
