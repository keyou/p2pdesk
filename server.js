
var x11 = require('x11');
var x11_node = require("node-x11");
var net = require('net');
var robot = require('robotjs');

// x11_node.init();

const server = net.createServer((client) => {
  // 'connection' listener.
  console.log('client connected');
  client.on('end', () => {
    console.log('client disconnected');
  });
  client.on('data', (data) => {
    console.log(data.toString());
    let d = JSON.parse(data.toString());
    robot.moveMouse(d.x,d.y);
    // x11_node.mouseMove(d.x, d.y);
    // x11_node.mouseMove(200, 500);
    // x11_node.mouseButton(1,false);
    // x11_node.mouseButton(3,false);
    // x11_node.mouseButton(1,false);
  });
  // client.write('hello\r\n');
  // client.pipe(client);
});
server.on('error', (err) => {
  throw err;
});
server.listen(13334, () => {
  console.log('server bound');
});



var Exposure = x11.eventMask.Exposure;
var PointerMotion = x11.eventMask.PointerMotion;

x11.createClient(function (err, display) {
  if (!err) {
    var X = display.client;
    var root = display.screen[0].root;
    var wid = X.AllocID();
    X.CreateWindow(
      wid, root,        // new window id, parent
      0, 0, 100, 100,   // x, y, w, h
      0, 0, 0, 0,       // border, depth, class, visual
      { eventMask: Exposure | PointerMotion } // other parameters
    );
    X.MapWindow(wid);
    var gc = X.AllocID();
    X.CreateGC(gc, wid);
    X.on('event', function (ev) {
      if (ev.type == 12) {
        X.PolyText8(wid, gc, 50, 50, ['Hello, Node.JS!']);
      }
    });
    X.on('error', function (e) {
      console.log(e);
    });
  } else {
    console.log(err);
  }
});
