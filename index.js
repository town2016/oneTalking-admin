const express = require('express')
const mongoose = require('mongoose') // 加载数据库操作模块
const bodyParser = require('body-parser') // 加载请求体的解析插件
const Cookies = require('cookies')
const session = require("express-session"); // 引入session
const app = express()
// bodyParser配置
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());


// 创建 session 中间件
app.use(
  session({
    secret: 'inneractive',
    name: 'session-id',
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: false},
    resave: true,
    rolling: true,
    saveUninitialized: true
  })
)

// 设置cookie中间件
app.use(function (req, res, next) {
  req.cookies = new Cookies(req, res)
  var noAuth = ['/user/register', '/api/dynamicList', '/user/login', '/api/fileUpload']
  if (noAuth.indexOf(req._parsedUrl.pathname) < 0 && !req._parsedUrl.pathname.includes('/uploads/')) {
    if (!req.cookies.get('session-id') || !req.session.user) {
      console.log('用户未登录')
    }
  }
  next()
})

// 捕获异常信息
app.use(function (err, req, res, next) {
  console.warn('错误处理中间捕获Exception', err);
  res.send('内部错误');
});
// 设置静态文件路径
app.use('/uploads', express.static(__dirname + '/uploads'))
// 初始化并连接数据库
mongoose.connect('mongodb://112.74.39.234:27017/oneTalking', {useNewUrlParser:true}, function (err, mongo) {
  if (err) {
    console.log('数据库连接失败')
  } else {
    console.log('数据库连接成功')
    app.listen(8080, function () {
      console.log('服务启动')
    })
  }
})


// API接口
app.use('/api', require('./routers/api'))
app.use('/user', require('./routers/user'))
