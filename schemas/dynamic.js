let mongoose = require('mongoose')
let Schema = mongoose.Schema
// populate
module.exports = new Schema({
  user: {type: mongoose.Schema.Types.ObjectId,ref: 'User'},
  createTime: {type: Date},
  dynamic: {type: String},
  imgList: {type: Array, default () {return []}},
  locations: {type: String}
})
