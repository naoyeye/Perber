#! /usr/bin/env  bash

# Author: liu lianxiang <leeoxiang@gmail.com>


MAINMODULE=manage:app

case $1 in
    start)
        # exec gunicorn -D -w 4  -p /tmp/perber.pid -b 127.0.0.1:6789 $MAINMODULE
        ;;
    stop)
        # kill -INT `cat /tmp/perber.pid`
        ;;
    restart)
        # kill -INT `cat /tmp/perber.pid`
        # exec gunicorn -D -w 4  -p /tmp/perber.pid -b 127.0.0.1:6789 $MAINMODULE
        ;;
    debug)
        exec node perber/app.js
        ;;
    *)
        echo "./ctlapp.sh start | stop | restart | debug"
        ;;
esac
