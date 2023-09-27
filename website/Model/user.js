const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        //max: 50
    },
    
    email: {
        type: String,
        trim: true,
        required: true,
        //max: 50,
        unique: true
    },

    std_id: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        maxlength: 10,
        minlength: 10
    },

    password: {
        type: String, 
        required: true
    },

    // is_admin: {
    //     type: Boolean,
    //     required: true
    // },

    token: {
        type: String, 
        default: ''
    },

    is_verified: {
        type: Boolean,
        default: 0
    }
}, {timestamps: true})

const user = mongoose.model('New_user', userSchema)
module.exports = user