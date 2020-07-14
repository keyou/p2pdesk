
var x11 = require('x11');

var spawn = require('child_process').spawn;

const net = require('net');
const client = net.createConnection({ port: 13334 }, ()=>{
  // 'connect' listener.
  console.log('connected to server!');
  //   client.write('world!\r\n');
});

client.on('data', (data) => {
  console.log(data.toString());
  //   client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
client.on('error', (err) => {
  console.error(err);
});

function crateWindow() {

  x11.createClient(function (err, display) {
    var X = display.client;
    var root = display.screen[0].root;
    var wid = X.AllocID();
    var w = 192 * 3;
    var h = 108 * 3;
    X.CreateWindow(
      wid, root,        // new window id, parent
      0, 0, w, h,   // x, y, w, h
      0, 0, 0, 0,       // border, depth, class, visual
      {
        eventMask:
          x11.eventMask.Exposure |
          x11.eventMask.PointerMotion |
          x11.eventMask.ButtonPress |
          x11.eventMask.ButtonRelease
      } // other parameters
    );
    X.MapWindow(wid);

    console.log('wid: ', wid);
    //var mplayer = spawn('mpv', ['--wid', wid, './test.h264']);

    var mpid;
    X.on('event', function (ev) {
      // console.log("event: ", ev);
      try {
        if (ev.name == 'CreateNotify')
          mpid = ev.wid;
        if (ev.name == 'ConfigureNotify' && ev.wid == wid) {
          X.ResizeWindow(mpid, ev.width, ev.height);
        }
        if (ev.name == 'MotionNotify' && ev.wid == wid) {
          let data = JSON.stringify({ type: 'move', x: ev.x * 1920 / w, y: ev.y * 1080 / h });
          console.log(data);
          client.write(data);
        }
        if ((ev.name == 'ButtonPress' || ev.name == 'ButtonRelease') && (ev.keycode >= 1 || ev.keycode <= 3)) {
          let data = JSON.stringify({
            type: 'button',
            button: ev.keycode == 1 ? 'left' : ev.keycode == 2 ? 'middle' : 'right',
            state: ev.name == 'ButtonPress' ? 'down' : 'up',
            x: ev.x * 1920 / w,
            y: ev.y * 1080 / h
          });
          console.log(data);
          client.write(data);
        }
      } catch (err) {
        console.log("error: ", err);
      }

    });
  });
}

crateWindow();
