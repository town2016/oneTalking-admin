let mongoose = require('mongoose')
let Schema = mongoose.Schema
// populate
var dynamicSchema = new Schema({
  user: {type: mongoose.Schema.Types.ObjectId,ref: 'User',default () {return ''}},
  createTime: {type: Date},
  dynamic: {type: String},
  imgList: {type: Array, default () {return []}},
  locations: {type: String},
  praised: [
    {
      type: mongoose.Schema.Types.ObjectId,ref: 'User'
    }
  ],
  praises: [
    {
      type: mongoose.Schema.Types.ObjectId,ref: 'User'
    }
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId, ref: 'Comment'
    }
  ]
})

module.exports = dynamicSchema