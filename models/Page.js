const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    },
    keywords: [String],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    featuredImage: {
        type: String,
        default: ''
    },
    template: {
        type: String,
        default: 'default'
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    seo: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create page slug from title
pageSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // remove non-word [a-zA-Z0-9_], non-whitespace, non-hyphen characters
            .replace(/[\s_-]+/g, '-')  // swap any length of whitespace, underscore, hyphen characters with a single hyphen
            .replace(/^-+|-+$/g, '');   // remove leading, trailing hyphens
    }
    next();
});

module.exports = mongoose.model('Page', pageSchema);
