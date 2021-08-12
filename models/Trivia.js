const mongoose = require('mongoose');

const schema = mongoose.Schema({
    question: String,
    answer: Boolean,
    approved: Boolean,
    category: String,
    createdAt: Number
})

module.exports = mongoose.model("Trivia", schema)