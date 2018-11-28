let mongoose = require('mongoose')
let Schema = mongoose.Schema
module.exports = new Schema({
  dynamic: {type: mongoose.Schema.Types.ObjectId, ref: 'Dynamic'},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  userName: String,
  createTime: {type: Date, default: new Date()},
  content: String
})
