let mongoose = require('mongoose')
let dynamicSchema = require('../schemas/dynamic')
module.exports = mongoose.model('Dynamic', dynamicSchema)
