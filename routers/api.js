const express = require('express')
const router = express.Router()
const Cookies = require('cookies')
const Dynamic = require('../models/Dynamic')
const User = require('../models/User')
var fs = require('fs')
var multer = require('multer')
var upload = multer({dest:'./uploads'})
// 设置数据统一返回格式
let response = {}
router.use(function (req, res, next) {
  response = {
    code: 200,
    message: ''
  }
  next()
})

// 将用户上传的图片分别存到用户对应的账户的文件夹下面
router.use(function (req, res, next) {
  req.cookies = new Cookies(req, res)
  var userInfo = req.cookies.get('userInfo') ? JSON.parse(req.cookies.get('userInfo')) : req.cookies.get('userInfo')
  if (req.url === '/fileUpload') {
    upload = multer({dest:`./uploads/${userInfo.account}`})
  }
  next()
})

// 文章图片上传
router.post('/fileUpload',  upload.array("files"), function (req, res, next) {
    if (req.files.length > 9) {
      response.code = 500
      response.message = '最多上传9张图片'
      res.json(response)
      return
    }
    response.data = []
    var userInfo = req.cookies.get('userInfo') ? JSON.parse(req.cookies.get('userInfo')) : req.cookies.get('userInfo')
    for (var i = 0; i < req.files.length; i++) {
      var times = new Date().getTime()
      var tmp_path = req.files[i].path;
      // 指定文件上传后的目录 - 示例为"images"目录。 
      var target_path = `./uploads/${userInfo.account}/${times}` + req.files[i].originalname;
      // 移动文件
      let renameRes = fs.renameSync(tmp_path, target_path);
      if (!renameRes) {
        response.data.push(`./uploads/${userInfo.account}/${times}` + req.files[i].originalname)
      }
    }
    response.message = '上传成功'
    res.json(response)
})

// 图片删除
router.get('/fileDelete', function (req, res, next) {
  var userInfo = req.cookies.get('userInfo') ? JSON.parse(req.cookies.get('userInfo')) : req.cookies.get('userInfo')
  if (!userInfo) {
    response.code = 500
    response.message = '文件不存在'
    res.json(response)
    return
  }
  var path = `./uploads/${userInfo.account}/` + req.query.fileName;
  let isExist = fs.existsSync(path)
  if (!isExist) {
    response.code = 500
    response.message = '文件不存在'
    res.json(response)
    return
  }
  let removeRes = fs.unlinkSync(path)
  if (!removeRes) {
    response.message = '删除成功'
    res.json(response)
  } else {
    response.code = 500
    response.message = '删除失败'
    res.json(response)
  }
})

// 动态发布
router.post('/createDynamic', function (req, res, next) {
  var userInfo = req.cookies.get('userInfo') ? JSON.parse(req.cookies.get('userInfo')) : req.cookies.get('userInfo')
  if (!userInfo) {
    response.code = 500
    response.message = '未登录状态'
    res.json(response)
    return
  }
  var params = req.body
  params.createTime = new Date()
  params.user = userInfo._id
  Dynamic.create(params).then(doc => {
    if (doc) {
      response.message = '操作成功'
      // 更新用户的dynamicCount
      User.findById(userInfo._id).then(user => {
        if (user) {
          // 查出改用户的动态总条数
          Dynamic.countDocuments({user: userInfo._id}).then(len => {
            if (len) {
              user.dynamicCount = len
              User.update(user).then((err, doc) => {
                if (err) {
                  console.log(err)
                } else {
                  console.log(doc)
                }
              })
            }
          })
        }
      })
      
    } else {
      response.message = '操作失败'
      response.code = 500
    }
    res.json(response)
  })
})

// l拉取动态列表
router.get('/dynamicList', function (req, res) {
  var skip = req.query.pageNumber ? (req.query.pageNumber - 1) * 5 : 0
  var query = req.query
  if (query.pageNumber) {
    delete query.pageNumber
  }
  Dynamic.find({...query}, {__v: 0}).sort({'createTime': -1}).limit(5).skip(skip).populate('user', {__v: 0, pwd: 0}).then((docs) => {
    response.data = []
    if (docs.length > 0) {
      response.data = docs
    }
    res.json(response)
  })
})

module.exports = router