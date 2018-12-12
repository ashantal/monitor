var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util          = require('util');

var port = process.env.PORT || 3000;
var efc = require('./efc.js');
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a monitor connected...');
});

efc.block_events(io);

http.listen(port, function(){
  console.log('listening on *:' + port);
});
