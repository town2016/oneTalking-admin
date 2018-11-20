let mongoose = require('mongoose')
let Schema = mongoose.Schema
module.exports = new Schema({
  account: {type: String, required: true},
  email: {type: String, required: true},
  pwd: {type: String, required: true},
  createTime: Date,
  updateTime: Date,
  praiseCount: {type: Number, default () {return 0}},
  dynamicCount: {type: Number, default () {return 0}},
  avatar: String,
  active:{type: Number, default () {return 0}}
})
