const mongoose = require('mongoose');

const schema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    hashedPassword: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    isAdmin: Boolean,
    token: String
})

module.exports = mongoose.model("User", schema)