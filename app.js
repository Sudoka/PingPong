/**
 * Server.
 */

function Server( port )
{
  this.port = process.env.PORT || port;
  this.express = require('express');  
  this.app = this.express.createServer();
} 

Server.prototype = {
    
    configure: function Server_configure () {
      var server = this;
      this.app.configure(function () {
        server.app.use(server.express.static(__dirname + '/public'));
        server.app.set('views', __dirname);
        
        // disable layout
        server.app.set("view options", {layout: false});
        
        /* make a custom html template */
        server.app.register('.html', {
          compile: function(str, options){
            return function(locals){
              return str;
            };
          }
        });
      });
    },
    
    setRoutes: function Server_setRoutes () {
      this.app.get('/', function (req, res) {
        res.render('index.html');
      });
    },
    
    listen: function Server_listen () {
      var server = this;
      this.app.listen(this.port, function () {
        var addr = server.app.address();
        console.log('   app listening on http://' + addr.address + ':' + addr.port);
      });    
    }
}

function PingPong () {
  this.pong = require('./public/lib/pong');
  this.sio = require('socket.io');
  this.io = this.sio.listen(server.app, { log: false });
  this.nicknames = {};
  this.state = { intervalId: 0, connections: 0 };
}

PingPong.prototype = {

  play: function PingPong_play () {
    var context = this;
    this.io.sockets.on('connection', function (socket) {
      
      socket.on('user message', function (msg) {
        socket.broadcast.emit('user message', socket.nickname, msg);
      });

      socket.on('nickname', function (nick, fn) {
        if (context.nicknames[nick]) {
          fn(true);
        } else {
          fn(false);

          context.pong.main( context.io, socket, context.state );
          
          context.nicknames[nick] = socket.nickname = nick;
          socket.broadcast.emit('announcement', nick + ' connected');
          context.io.sockets.emit('nicknames', context.nicknames);
        }
      });  
      console.log(context.nicknames);
      socket.on('disconnect', function () {
        if (!socket.nickname) return;
        delete context.nicknames[socket.nickname];
        
        context.pong.removePlayer( context.io, socket );
        console.log('player left');
        console.log(context.nicknames);
        socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
        socket.broadcast.emit('nicknames', context.nicknames);
      });
    });
  }
}


var server = new Server( 3000 );
server.configure();
server.setRoutes();
server.listen();

var pingpong = new PingPong();
pingpong.play();