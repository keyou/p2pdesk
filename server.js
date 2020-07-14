
var x11 = require('x11');
var net = require('net');
var robot = require('robotjs');

const server = net.createServer((client) => {
  // 'connection' listener.
  console.log('client connected');
  client.on('end', () => {
    console.log('client disconnected');
  });
  client.on('data', (chunk) => {
    console.log(chunk.toString());
    let data = JSON.parse(chunk.toString());
    if(data.type == 'move') robot.moveMouse(data.x,data.y);
    if(data.type == 'button') robot.mouseToggle(data.state,data.button);
    // if(data.type == 'click') robot.mouseClick(data.button,data.x,data.y);
    // if(data.type == 'drag') robot.dragMouse(data.x,data.y);
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

return;
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
