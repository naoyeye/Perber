# About

I think it might be a meaningless thing(>_<), but just like a small experimental. I prefer to think of it as a hollow. The difference with hollow is: nobody knows who I am, but they can see what I said. when someone 'touch' my words, it'll disappear.

Maybe you can think of Perber as a blackboard in the square, anyone can put on the cloak into the square, write text and paste picture on the blackboard, anyone can also put them cleared. yep, it's realtime! (thanks to socket.io)

> "Not a community, not a forum, not a micro-blog, not a chat room."

> "No follow, no timeline, no notification, no registration."

> "All the words will gone, only the void forever lone."

> "Any information published by anyone may also be deleted by anyone."

## Requirements

node.js, socket.io, redis, jade, mysql(node-mysql), node-qiniu

Perber use **Qiniu** to store pictures, so, you'll need a "**bucket_name**" "**access_key**" and "**secret_key**".

> Qiniu Cloud Storage: [http://www.qiniu.com/](http://www.qiniu.com/) 

> Qiniu on Github: [https://github.com/qiniu](https://github.com/qiniu)

## How To Start

1. create database `Perber` in **MySQL** , create tables use **perber.sql**

2. run `npm install` in directory: **/Peber/perber/**

3. change the file `config-example.json` (directory: **/Perber/perber/config/** ) to `config.json`

4. modify `mysqlConf` `qiniuConfig`(make sure you got the **bucket_name**, **access_key** and **secret_key**) and `mailer` in your `config.json` file.

5. run server: `node perer/app.js`

6. open in browser : [http://localhost:6789](http://localhost:6789) (the default port is 6789)


**Tips:**

> you can also use "node-supervisor" to run perber : [https://github.com/isaacs/node-supervisor](https://github.com/isaacs/node-supervisor)

> `npm install supervisor -g`

> `supervisor perber/app.js`

>If you want run Perber on your online server, maybe you should install "forever" [https://github.com/nodejitsu/forever](https://github.com/nodejitsu/forever) :

> `npm install forever -g` 
 
> `forever start perer/app.js` 


##config.json:

**redisURL**

your redis url, default is "http://localhost/"

**mysqlConf**

your mysql host, port, user, password.


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





## UI Preview

* Web preview in iOS Safari:

![Perber in iOS Safari](http://ww2.sinaimg.cn/large/61b8bbf4tw1eg3q0lcsc5j20cn0m8dhz.jpg)

* Perber in Chrome(Mackbook Pro 13):

![Perber in Chrome](http://ww1.sinaimg.cn/large/61b8bbf4tw1eg3okf24rij21340vk0yl.jpg)

![Perber in Chrome](http://ww1.sinaimg.cn/large/61b8bbf4tw1eg3olvkq95j20on0q60vm.jpg)


## xiamiRun
A service for parsing the real path of Xiami songs

https://github.com/naoyeye/xiamiRun


## The starting point:
[http://www.douban.com/group/topic/45262966/](http://www.douban.com/group/topic/45262966/)

## License

This code is distributed under the terms and conditions of the [MIT license](LICENSE).


