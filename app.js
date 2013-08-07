var http = require('http'),
    httpProxy = require('http-proxy'),
    util = require('util'),
    colors = require('colors'),
    express = require('express'),
    path = require('path'),
    tamper = require('tamper'),
    events = require('events');



// list of urls, which will not be displayed in output
var silentUrls = ['/favicon.ico','/socket.io/socket.io.js'];




// ### SOCKET.IO 
// custom event emitting interface
function MyEmitter () {
  events.EventEmitter.call(this);
}

util.inherits(MyEmitter, events.EventEmitter);
var e = new MyEmitter;



// ### pairing of request - response objects in front-end
var Identifier = {
  identifier : null,
  get : function () {
    if (this.identifier == null) {
      this.identifier = Date.now();
    }
    return this.identifier;
  },
  reset : function () {
    this.identifier = Date.now();
  }
}


// #### PROXY SERVER
var proxyOut = tamper(function(req, res) {
  // Return a function in order to capture and modify the response body:
  return function(body) {
      
    var resp = {
    "StatusCode" : res.statusCode,
    "Headers" : (res._headers || 'no headers'),
    "Body" : body   
      
    };
    
    resp.identifier = Identifier.get();
    Identifier.reset();

    e.emit("res", resp);

    

    return body;
  }

});
// proxyLogger middleware - used to log all requests and responses to console
var proxyIn = function (req, res, next){
  
  // fiter silent URIs right from the start
  if (silentUrls.indexOf(req.url) > -1){
    return false;
    }
  
  var requ = {
    "Url" : req.url,
    "Method" : req.method,
    "Headers" : req.headers,
    "Body" : req.body
  }

  requ.identifier = Identifier.get();

  e.emit("req", requ);
    
  next();
}









// EXPRESS SOCKET.IO SERVER
var app = express();
  
app.configure(function(){
  app.set('port', 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
/*   app.use(express.logger('dev')); */
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.engine('jade', require('jade').__express);
});

app.all('/', function(req, res){
  res.render('sniffer');
});


var server = http.createServer(app),
  io = require('socket.io').listen(server, {log: false});

io.sockets.on('connection', function (socket) {

      e.on("res", 
        function (obj) { 
          // util.puts('RESPONSE'.red)
          // console.log(obj);  
          // obj.identifier = identifier;

          socket.emit('response', obj);
        });
      e.on("req", 
        function (obj) { 
          // util.puts("\n\n\nREQUEST:".green)
          // console.log(obj);
          // obj.identifier = identifier;
          // var identifier = Date.now();  

          socket.emit('request', obj);
        });
});


server.listen(app.get('port'));


util.puts('express socket.io server '.blue + 'started '.green.bold 
    + 'on port '.blue + '3000 '.yellow);









// Create a proxy server with custom application logic

httpProxy.createServer(
  express.bodyParser(),
  proxyIn,
  proxyOut,
  function (req, res, proxy) {
  //
  // Put your custom server logic here
  //
  proxy.proxyRequest(req, res, {
    host: '192.168.28.11',
    port: 8080

  });
}).listen(8000);

util.puts('http proxy server '.blue + 'started '.green.bold 
    + 'on port '.blue + '8000 '.yellow + ' proxying everything to '.blue + '192.168.28.11:8080'.magenta.underline);

