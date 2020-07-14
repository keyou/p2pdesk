
var x11 = require('x11');
var x11_node = require("node-x11");

var spawn = require('child_process').spawn;

const net = require('net');
const client = net.createConnection({ port: 13334 }, onConnection);

client.on('data', (data) => {
  console.log(data.toString());
  //   client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});

function onConnection() {
  // 'connect' listener.
  console.log('connected to server!');
  //   client.write('world!\r\n');


  var Exposure = x11.eventMask.Exposure;
  var PointerMotion = x11.eventMask.PointerMotion;

  x11.createClient(function (err, display) {
    var X = display.client;
    var root = display.screen[0].root;
    var wid = X.AllocID();
    var w = 192 * 2;
    var h = 108 * 2;
    X.CreateWindow(
      wid, root,        // new window id, parent
      0, 0, w, h,   // x, y, w, h
      0, 0, 0, 0,       // border, depth, class, visual
      { eventMask: Exposure | PointerMotion } // other parameters
    );
    X.MapWindow(wid);

    console.log('wid: ', wid);
    //var mplayer = spawn('mpv', ['--wid', wid, './test.h264']);

    x11_node.init();

    var mpid;
    X.on('event', function (ev) {
      console.log("event: ", ev);
      try {
        if (ev.name == 'CreateNotify')
          mpid = ev.wid;
        if (ev.name == 'ConfigureNotify' && ev.wid == wid) {
          X.ResizeWindow(mpid, ev.width, ev.height);
        }
        if (ev.name == 'MotionNotify' && ev.wid == wid) {
          console.log('x,y= ' + ev.x + "," + ev.y);
          client.write(JSON.stringify({type:'move',x:ev.x * 1920 / w, y:ev.y * 1080 / h}));
        }
      } catch (err) {
        console.log("error: ", err);
      }

    });
  });
}
