# Perber 是什么

 一个可以实时匿名群聊的 web 服务。
 特色是无需注册，每个人都可以删掉其他人说的话。

## 用到了哪些

- **express**
- **socket.io**
- **redis**


## 功能

- 长按消息块，删除
- 来新消息时声音提醒
- @某人时，会链接到他的twitter
- 简单的颜文字表情识别
- 识别新浪图床<del>和 instagram</del>的图片 url ，直接展示图片
- 识别发言人所在城市或国家
- 支持中英文识别，英文会以大字体显示
- 支持虾米音乐识别（不太稳定，最好是以 https://www.xiami.com/song/1769490347 这种数字 id 类型的 url 来测试）
- <del>上传图片</del> **20181022 - 因七牛 api 调整，上传图片功能暂时关闭**
- 限制单个人发言次数



## 如何运行

1. 在你的 **MySQL** 中创建名为 `perber` 的数据库, 然后导入项目根目录中的 **perber.sql**。

2. 在 **/Peber/perber/** 中运行 `npm install`，安装项目所需的包，当然运行 `yarn` 也可以。

3. 修改 `config-example.json` (位于目录: **/Perber/perber/config/** 中) 为 `config.json`

4. 修改 `config.json` 中的 `mysqlConf` `qiniuConfig`(前提是已经有了自己的 **bucket_name**, **access_key** 和 **secret_key**) 和 `mailer`.

5. 启动: `node perber/app.js`

6. 在浏览器中访问 : [http://localhost:6789](http://localhost:6789) (默认端口为 6789)




## 设置 config.json:

**redisConf**

如果 redis 端口没改过，基本上保持默认就好

**mysqlConf**


设置你的 mysql host, port, user, password, database.


**qiniuConfig**

设置七牛

Perber 用到了 **Qiniu** 来存储图片, 你需要注册 Qiniu 来获得 "**bucket_name**" "**access_key**" 和 "**secret_key**"。

> Qiniu Cloud Storage: [http://www.qiniu.com/](http://www.qiniu.com/) 
> Qiniu on Github: [https://github.com/qiniu](https://github.com/qiniu)

**qqMap**

设置腾讯地图 API key: https://lbs.qq.com/guides/startup.html

**mailer**

用来发信的，可以写俩自己的邮箱

**auth**

暂时没有用到

**session**

设置 key 和 secret

**app**

设置服务运行的端口号（默认端口为 6789）、timer、limit

    **app.timer:**

    清理程序 sockets.js 里的cleaner() 的自动运行时间间隔，按分钟计算。

    设为 1 ，则 1分钟运行一次。

    **app.limit:**

    在设定的 timer 时间范围内，每个在线用户最多能发多少信息。

**theme**

保持默认就行，目前只有 default 一种

**debug** : true | false

调试用的





## API

目前只有一个，没什么用。

#### post new message

**url**: /api/v1/new

```
var data = { msg: "HAKULAMATATA test api" };
$.ajax({
    url:'http://www.perber.com/api/v1/new',
    contentType: 'application/json; charset=utf-8',
    type: 'POST',
    data : JSON.stringify(data)
})
```






## UI

* iOS Safari:

![Perber in iOS Safari](http://ww2.sinaimg.cn/large/61b8bbf4tw1eg3q0lcsc5j20cn0m8dhz.jpg)

* Chrome(Mackbook Pro 13):

![Perber in Chrome](http://ww1.sinaimg.cn/large/61b8bbf4tw1eg3okf24rij21340vk0yl.jpg)

![Perber in Chrome](http://ww1.sinaimg.cn/large/61b8bbf4tw1eg3olvkq95j20on0q60vm.jpg)


## 依赖的第三方服务

- apis.map.qq.com：腾讯地图 API，用于解析 ip， 显示所在城市或国家

- xiamiRun：之前写的一个用来解析虾米音乐地址的服务 https://github.com/naoyeye/xiamiRun 不太稳定


## 为什么做这个:
[http://www.douban.com/group/topic/45262966/](http://www.douban.com/group/topic/45262966/)

## License

This code is distributed under the terms and conditions of the [MIT license](LICENSE).


