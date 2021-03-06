var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util          = require('util');

var port = process.env.PORT || 8081;
var efc = require('./efc.js');
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('disconnect', () => {
    console.log('a monitor disconnected')
  })

  socket.on('sync', (startingBlock)=>{
    var options={};
    var startAt=parseInt(startingBlock);
    if(!isNaN(startAt)){
      if(startAt<3){
          startAt=3; //first block with application event
      }
      options={startBlock:startAt}     
    }
    efc.emit_events(socket,	options);
  });  
  console.log('a monitor connected...');
});


efc.emit_events(io, {unregister: false, disconnect: false});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
