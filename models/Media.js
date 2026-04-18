const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalname: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    dimensions: {
        width: Number,
        height: Number
    },
    altText: {
        type: String,
        default: ''
    },
    caption: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    folder: {
        type: String,
        default: 'uploads'
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Virtual for file URL
mediaSchema.virtual('url').get(function() {
    return `${process.env.APP_URL || 'http://localhost:3000'}${this.path}`;
});

// Index for search
mediaSchema.index({
    filename: 'text',
    originalname: 'text',
    altText: 'text',
    caption: 'text',
    description: 'text'
});

module.exports = mongoose.model('Media', mediaSchema);
