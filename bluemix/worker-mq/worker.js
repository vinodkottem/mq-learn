var express = require('express');
var AmqpChannel = require('./rabbit-amqp');
var app = express();
var port = process.env.PORT || 8080;
var queue = 'messages';
var VCAPAPP;
var instanceId;

if (process.env.NODE_ENV == 'production') {
    VCAPAPP = JSON.parse(process.env.VCAP_APPLICATION);
    instanceId = VCAPAPP.instance_index;
}

var count = 0;
var errcount = 0;
var waittll = 0;
var lastaction;
app.get('/message/count', function (req, res) {
    res.send({
        identity: instanceId,
        count: {
            success: count,
            error: errcount,
        },
        waittime: new Date().getTime() - lastaction
    });
})

app.listen(port, function () {
    console.log('Example app listening on ' + port + '!')
})



AmqpChannel(queue, function (err, channel, conn) {
    if (err) {
        console.error(err.stack);
    } else {
        console.log('channel and queue created');
        consume();
    }

    function consume() {
        channel.get(queue, {}, onConsume);

        function onConsume(err, msg) {
            if (err) {
                console.warn(err.message);
            } else if (msg) {
                console.log(instanceId + 'INSTANCE consuming %j', msg.content.toString());
                setTimeout(function () {
                    channel.ack(msg);
                    consume();
                }, 1e3);
            } else {
                lastaction = new Date().getTime();
                //console.log('no message, waiting...');
                setTimeout(consume, 1e3);
            }
        }
    }
});

/*process.stdin.resume();

process.on('SIGINT', function () {
    conn.close();
});

process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}));*/
