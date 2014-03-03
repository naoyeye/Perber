# Perber

I think it might be a meaningless thing(>_<), but just like a small experimental. I prefer to think of it as a hollow. The difference with hollow is: nobody knows who I am, but they can see what I said. when someone 'touch' my words, it'll disappear.

Maybe you can think of Perber as a blackboard in the square, anyone can put on the cloak into the square, write text and paste picture on the blackboard, anyone can also put them cleared. 

> "Not a community, not a forum, not a micro-blog, not a chat room."

> "No follow, no timeline, no notification, no registration."

> "All the words will gone, only the void forever lone."

> "Any information published by anyone may also be deleted by anyone."

## Requirements

node.js(express), socket.io, redis, jade, mysql(node-mysql), node-qiniu

## Start

0 into the project root directory: `/Perber/`

1 `npm install`

2 change the file `config-example.json` (in '/Perber/perber/config/' ) to `config.json`

3 modify: `mysqlConf` in your `config.json` file.

4 `node perer/app.js`

p.s. If you want run Perber on Server, maybe you should install "forever" : `npm install forever -g`

then: `forever start perer/app.js`

## UI

* Web preview in iOS Safari:

![Perber preview in iOS Safari](http://ww2.sinaimg.cn/mw690/61b8bbf4gw1ee2vic6rhwj20hs0vkmzm.jpg)

* Fullscreen in Chrome(Mackbook Pro 13):

![Perber fullscreen in Chrome](http://ww4.sinaimg.cn/large/61b8bbf4gw1ee2vicc9x2j20zk0m8n0s.jpg)


## Starting point
http://www.douban.com/group/topic/45262966/

## License

This code is distributed under the terms and conditions of the [MIT license](LICENSE).


