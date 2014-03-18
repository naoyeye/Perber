# About

I think it might be a meaningless thing(>_<), but just like a small experimental. I prefer to think of it as a hollow. The difference with hollow is: nobody knows who I am, but they can see what I said. when someone 'touch' my words, it'll disappear.

Maybe you can think of Perber as a blackboard in the square, anyone can put on the cloak into the square, write text and paste picture on the blackboard, anyone can also put them cleared. 

> "Not a community, not a forum, not a micro-blog, not a chat room."

> "No follow, no timeline, no notification, no registration."

> "All the words will gone, only the void forever lone."

> "Any information published by anyone may also be deleted by anyone."

## Requirements

node.js(express), socket.io, redis, jade, mysql(node-mysql), node-qiniu

## How To Start

0 into the project root directory: `/Perber/`

1 `npm install`

2 change the file `config-example.json` (in '/Perber/perber/config/' ) to `config.json`

3 modify: `mysqlConf` `qiniuConfig` `mailer` in your `config.json` file.

4 run server: `node perer/app.js`

tips:

or use node-supervisor : https://github.com/isaacs/node-supervisor

`npm install supervisor -g`

`supervisor perber/app.js`


p.s. If you want run Perber on your online server, maybe you should install "forever" : https://github.com/nodejitsu/forever

`npm install forever -g`

`forever start perer/app.js`

## UI Preview

* Web preview in iOS Safari:

![Perber in iOS Safari](http://ww2.sinaimg.cn/mw690/61b8bbf4gw1ee2vic6rhwj20hs0vkmzm.jpg)

* Perber in Chrome(Mackbook Pro 13):

![Perber in Chrome](http://ww2.sinaimg.cn/large/ed133892gw1ee8kx8udjbj210i105k0q.jpg)

![Perber in Chrome](http://ww1.sinaimg.cn/large/ed133892gw1ee8kxy2dxqj210i1jwn8k.jpg)


## The starting point:
http://www.douban.com/group/topic/45262966/

## License

This code is distributed under the terms and conditions of the [MIT license](LICENSE).


