let mongoose =require('mongoose')
let pariseSchema = require('../schemas/parise')
module.exports = mongoose.model('Parise', pariseSchema)
