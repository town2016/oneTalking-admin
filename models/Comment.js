let mongoose =require('mongoose')
let commentSchema = require('../schemas/comment')
module.exports = mongoose.model('Comment', commentSchema)
