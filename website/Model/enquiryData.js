const mongoose = require('mongoose');
const Schema = mongoose.Schema

const enquirySchema = new Schema ({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        required: true
    }
}, {timestamps: true})

const contactForm = mongoose.model("User_Enquiries", enquirySchema);
module.exports = contactForm