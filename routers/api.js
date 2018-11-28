const express = require('express')
const router = express.Router()
const Cookies = require('cookies')
const Dynamic = require('../models/Dynamic')
const User = require('../models/User')
const Parise = require('../models/Parise')
const Comment = require('../models/Comment')
var fs = require('fs')
var multer = require('multer')
var upload = multer({dest:'./uploads'})
const mongoose = require('mongoose')
const axios = require('axios')
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
  var userInfo = req.session.user
  if (req.url === '/fileUpload') {
    if (userInfo) {
      upload = multer({dest:`./uploads/${userInfo._id}`})
    }
  }
  next()
})

// 文章图片上传
router.post('/fileUpload',upload.array("files"), function (req, res, next) {
    var userInfo = req.session.user
    if (!userInfo) {
      for (var i = 0; i < req.files.length; i++) {
        var times = new Date().getTime()
        var tmp_path = req.files[i].path;
        // 指定文件上传后的目录 - 示例为"images"目录。 
        var target_path = `./uploads/` + req.files[i].originalname;
        // 移动文件
        let renameRes = fs.renameSync(tmp_path, target_path);
        (function (path) {
          fs.unlinkSync(path)
        })(target_path)
      }
      response.code = 401
      response.message = '用户未登录'
      res.json(response)
      return
    }
    if (req.files.length > 9) {
      response.code = 500
      response.message = '最多上传9张图片'
      res.json(response)
      return
    }
    response.data = []
    for (var i = 0; i < req.files.length; i++) {
      var times = new Date().getTime()
      var tmp_path = req.files[i].path;
      // 指定文件上传后的目录 - 示例为"images"目录。 
      var target_path = `./uploads/${userInfo._id}/${times}_` + req.files[i].originalname;
      // 移动文件
      let renameRes = fs.renameSync(tmp_path, target_path);
      if (!renameRes) {
        response.data.push(`./uploads/${userInfo._id}/${times}_` + req.files[i].originalname)
      }
    }
    response.message = '上传成功'
    res.json(response)
})
// 图片删除
router.get('/fileDelete', function (req, res, next) {
  var userInfo = req.session.user
  if (!userInfo) {
    response.code = 401
    response.message = '未登录状态'
    res.json(response)
    return
  }
  var path = `./uploads/${userInfo._id}/` + req.query.fileName;
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
  var userInfo = req.session.user
  if (!userInfo) {
    response.code = 401
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
              user.update({dynamicCount: len}).then((result) => {
                if (result) {
                  console.log(result)
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
router.get('/dynamicList', function (req, res, next) {
  var skip = req.query.pageNumber ? (req.query.pageNumber - 1) * 20 : 0
  var query = req.query
  var pageNumber = query.pageNumber
  var userInfo = req.session.user
  if (query.pageNumber) {
    delete query.pageNumber
  }
  Dynamic.find({...query}, {__v: 0}).sort({'createTime': -1}).limit(20).skip(skip).then((docs) => {
    response.data = {}
    var match = {}
    match = userInfo ? {_id: userInfo._id} : match
    var opts = [
      { path: 'user', select: {__v: 0, pwd: 0}},
      { path: 'praised', match: match},
      { path: 'praises'},
      { path: 'comments'}
     ]
    
    var promise = Dynamic.populate(docs, opts);
    promise.then(() => {
        Dynamic.countDocuments().then(len => {
          response.data = {
            total: len,
            list: docs,
            curNum: Number(pageNumber),
            totalNum: Math.ceil(len/20)
          }
          res.json(response)
        })
     })
    
  })
})

// 用户动态列表
router.get('/dynamicForUser', function (req, res, next) {
  var userInfo = req.session.user
  if (!userInfo) {
    response.code = 401
    response.message = '未登录状态'
    res.json(response)
    return
  }
  var skip = req.query.pageNumber ? (req.query.pageNumber - 1) * 20 : 0
  var query = req.query
  var pageNumber = query.pageNumber
  if (query.pageNumber) {
    delete query.pageNumber
  }
  query.user = userInfo._id
  Dynamic.find({...query}, {__v: 0}).sort({'createTime': -1}).limit(20).skip(skip).populate('user', {__v: 0, pwd: 0}).then((docs) => {
    response.data = {}
    Dynamic.countDocuments().then(len => {
      response.data = {
        total: len,
        list: docs,
        curNum: Number(pageNumber),
        totalNum: Math.ceil(len/20)
      }
      res.json(response)
    })
  })
})

// 用户删除动态
router.get('/dynamicDelete', function (req, res, next) {
  var userInfo = req.session.user
  if (!userInfo) {
    response.code = 401
    response.message = '未登录状态'
    res.json(response)
    return
  }
  var did = req.query.id
  Dynamic.findOne({_id: did, user: userInfo._id}, function (error, doc) {
    if (error) {
      response.data = '500'
      response.message = '删除对象不存在'
      res.json(response)
    } else {
      doc.remove(function (er) {
        if (er) {
          console.log(er)
        } else {
          response.message = '删除成功'
        }
        res.json(response)
      })
    }
  })
  
})

// 点赞
router.get('/parise', function (req, res, next) {
  var userInfo = req.session.user
  var query = req.query
  if (!userInfo) {
    response.code = 401
    response.message = '未登录状态'
    res.json(response)
    return
  }
  if (!query.id) {
    response.code = 500
    response.message = '点赞对象不存在'
    res.json(response)
    return
  }
  Parise.findOne({user: userInfo._id, dynamic: query.id}).then(doc => {
    if (doc) {
      Parise.remove(doc).then(result => {
        if (!result) {
          response.message = '取消点赞失败'
          response.code = 500
          res.json(response)
        } else {
          Dynamic.findById(query.id).then(dynamic => {
            if (dynamic) {
              var praiseList = dynamic.praises
              var praisedList = dynamic.praised
              dynamic.praises.map((item, index) => {
                if (item.toString() === userInfo._id.toString()) {
                  praiseList.splice(index, 1)
                  praisedList.splice(index, 1)
                }
              })
              dynamic.update({praises: praiseList, praised: praisedList}).then(d_res => {
                if (d_res) {
                  response.message = '取消点赞成功'
                  response.data = {...userInfo,opt: 'cancel'}
                  res.json(response)
                }
              })
            }
          })
        }
      })
    } else {
      Parise.create({user: userInfo._id, dynamic: query.id, createTime: new Date()}).then(parise => {
        if (!parise) {
          response.message = '点赞失败'
          response.code = 500
          res.json(response)
        } else {
          Dynamic.findById(query.id).then(dynamic => {
            if (dynamic) {
              dynamic.update({$addToSet: {praises: mongoose.Types.ObjectId(userInfo._id), praised: mongoose.Types.ObjectId(userInfo._id)}})
              .then(d_res => {
                if (d_res) {
                  response.message = '点赞成功'
                  response.data = {...userInfo, opt: 'praise'}
                  res.json(response)
                }
              })
            }
          })
        }
      })
    }
  })
})

// 评论
router.post('/commentSave', function (req, res, next) {
  var userInfo = req.session.user
  var query = req.query
  if (!userInfo) {
    response.code = 401
    response.message = '未登录状态'
    res.json(response)
    return
  }
  var params = req.body
  params.user = userInfo._id
  params.userName = userInfo.account
  Comment.create(params, function (err, doc) {
    if (err) {
      console.log(err)
    } else {
      Dynamic.findById(params.dynamic, function (derr, dynamic) {
        if (derr) {
          console.log(derr)
        } else {
          dynamic.update({$addToSet: {comments: doc._id}}, function (uerr, result) {
            if (err){
               console.log(err)
               response.message = '评论失败'
               response.code = 500
            } else {
              response.message = '评论成功'
              response.data = doc
            }
            res.json(response)
          })
        }
      })
    }
  })
})


module.exports = router