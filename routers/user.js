let express = require('express')
let router = express.Router()
const mongoose = require('mongoose')
const User = require('../models/User')
const _filter = {pwd: 0,_v: 0} // 过滤不需要暴露的字段
// 设置数据统一返回格式
let response = {}
router.use(function (req, res, next) {
  response = {
    code: 200,
    message: ''
  }
  next()
})
// 注册
router.post('/add', function (req, res) {
  var params = req.body
  if (params._id) {
    User.updateOne(params).then((err, doc) => {
      if (err) {
        response.code = 500
        response.message = '编辑失败'
      } else {
        response.message = '编辑成功'
      }
      res.json(response)
    })
  } else {
    params.createTime = params.updateTime = new Date()
    User.findOne({$or:[{account: params.account}, {email: params.email}]}, {pwd: 0}).then((doc) => {
      if (!doc) {
        User.create(params).then((docs) => {
          if (!docs) {
            response.code = 500
            response.message = '注册失败'
          } else {
            response.message = '注册成功'
            response.data = doc
          }
          res.json(response)
        })
      } else {
        response.code = 500
        response.message = '邮箱或用户名重复'
        res.json(response)
      }
    })
    
  }
})
// 登录
router.post('/login', function (req, res) {
  var params = req.body
  User.findOne({account: params.account,pwd: params.pwd}, _filter).then((doc) => {
    if (doc) {
      response.code = 200
      response.message = '登陆成功'
      response.data = doc
      req.session.user = doc
      res.json(response)
    } else {
      response.code = 500
      response.message = '用户名或密码错误'
      res.json(response)
    }
  })
})

// 获取用户信息
router.get('/getUserInfo', function (req, res) {
  var user = req.session.user || null
  if (!user) {
    response.code = 401
    response.message = '用户未登录'
  } else {
    response.data = user
  }
  res.json(response)
})
// 从苦衷拉取用户信息
router.get('/getUserInfoFromDB', function (req, res) {
  User.findById(req.session.user._id).then(doc => {
    response.data = doc
    res.json(response)
  })
})
// 用户信息编辑
router.post('/update', function (req, res) {
  var userInfo = req.session.user
  if (!userInfo) {
    response.code = 401
    response.message = '用户未登录'
    res.json(response)
    return
  }
  try{
    User.findOne({_id: mongoose.Types.ObjectId(userInfo._id)}, _filter).then((doc) => {
      if (doc) {
        var params = req.body
        doc.update(params).then(function (result) {
          if (!result) {
            response.code = 500
            response.message = '用户信息编辑失败'
          } else {
            response.data = doc
            response.data = Object.assign({}, doc, params)
            response.message = '用户信息编辑成功'
          }
          res.json(response)
        })
      } else {
        response.code = 500
        response.message = '未找到该用户'
        res.json(response)
      }
    })
  }catch(e){
    response.code = 500
    response.message = '未找到该用户'
    res.json(response)
  }
})

// 退出登录
router.get('/logout', function (req, res, next) {
  if (req.session.user) {
    req.session.destroy();
    response.message = '登出成功'
  } else {
    response.code = 401
    response.message = '当前状态为未登录状态'
  }
  
  res.json(response)
})

module.exports = router