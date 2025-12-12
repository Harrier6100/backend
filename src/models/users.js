const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: String,
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: [
            'admin',
            'user',
            'guest',
        ],
    },
    permissions: {
        type: [String],
        default: [],
    },
    expiryDate: Date,
    remarks: String,
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

const Users = mongoose.model('Users', userSchema);

module.exports = Users;
