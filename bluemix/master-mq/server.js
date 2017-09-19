var express = require('express');
var bodyParser = require('body-parser')
var AmqpChannel = require('./rabbit-amqp');
var app = express();
var port = process.env.PORT || 8080;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json())


app.post('/message', function (req, res) {
    var queue = 'messages';
    AmqpChannel(queue, function (err, channel, conn) {
        if (err) {
            console.error(err.stack);
        } else {
            var task = req.body || 'just a time stamp' + new Date().getTime();
            channel.assertQueue(queue, {
                durable: true
            });
            channel.sendToQueue(queue, encode(task), {
                persistent: true
            });
            setImmediate(function () {
                channel.close();
                conn.close();
            });
        }
        res.send({
            data: !err && 'success',
            error: err && err.toString()
        });
    });
})

app.listen(port, function () {
    console.log('Example app listening on ' + port + '!')
})


function encode(doc) {
    return new Buffer(JSON.stringify(doc));
}

/*process.stdin.resume();

process.on('SIGINT', function () {
    conn.close();
});

process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}));*/
