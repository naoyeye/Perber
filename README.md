# 关于

 一个可以实时匿名群聊的 web 服务。
 每个人都可以删掉其他人说的话。

# 用到了哪些东西

node.js, socket.io, redis, jade, mysql(node-mysql), node-qiniu

Perber 用到了 **Qiniu** 来存储图片, 你需要注册 Qiniu 来获得 "**bucket_name**" "**access_key**" 和 "**secret_key**"。

> Qiniu Cloud Storage: [http://www.qiniu.com/](http://www.qiniu.com/) 

> Qiniu on Github: [https://github.com/qiniu](https://github.com/qiniu)

## 开始

1. 在 **MySQL** 创建名为 `Perber` 的数据库, 然后导入项目根目录中的 **perber.sql** 来创建表。

2. 在 **/Peber/perber/** 中运行 `npm install`，安装项目所需的包。

3. 修改 `config-example.json` (位于目录: **/Perber/perber/config/** 中) 为 `config.json`

4. 修改 `config.json` 中的 `mysqlConf` `qiniuConfig`(前提是已经有了自己的 **bucket_name**, **access_key** 和 **secret_key**) 和 `mailer`.

5. 启动: `node perber/app.js`

6. 在浏览器中访问 : [http://localhost:6789](http://localhost:6789) (默认端口为 6789)


**Tips:**

> 本地开发可以用 "node-supervisor" : [https://github.com/isaacs/node-supervisor](https://github.com/isaacs/node-supervisor)

> `npm install supervisor -g`

> `supervisor perber/app.js`

> 如果想在服务器上运行，可以试试 "forever" [https://github.com/nodejitsu/forever](https://github.com/nodejitsu/forever) :

> `npm install forever -g` 
 
> `forever start perer/app.js` 


##config.json:

**redisURL**

redis url, default is "http://localhost/"

**mysqlConf**

mysql host, port, user, password, database.


**mailer**

// todo

**auth**

// todo

**session**

// todo

**app**

// todo

**app.timer:**

清理程序 sockets.js 里的cleaner() 的自动运行时间间隔，按分钟计算。

设为 1 ，则 1分钟运行一次。

**app.limit:**

在设定的 timer 时间范围内，每个在线用户最多能发多少信息。

**theme**

// todo

**debug** : true | false


## API

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

// todo





## UI

* iOS Safari:

![Perber in iOS Safari](http://ww2.sinaimg.cn/large/61b8bbf4tw1eg3q0lcsc5j20cn0m8dhz.jpg)

* Chrome(Mackbook Pro 13):

![Perber in Chrome](http://ww1.sinaimg.cn/large/61b8bbf4tw1eg3okf24rij21340vk0yl.jpg)

![Perber in Chrome](http://ww1.sinaimg.cn/large/61b8bbf4tw1eg3olvkq95j20on0q60vm.jpg)


## 广告：
### xiamiRun
一个用来解析虾米音乐地址的服务

https://github.com/naoyeye/xiamiRun


## 为什么做这个:
[http://www.douban.com/group/topic/45262966/](http://www.douban.com/group/topic/45262966/)

## License

This code is distributed under the terms and conditions of the [MIT license](LICENSE).


