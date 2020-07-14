
var x11 = require('x11');
var jot = require('json-over-tcp');

var spawn = require('child_process').spawn;

var client = jot.createConnection({ host: '192.168.78.132', port: 13334 }, function () {
  console.log('connected to server!');
});

client.on('end', () => {
  console.log("disconnected");
});

client.on('error', (err) => {
  console.log(err);
});

client.on('data', function (data) {
  console.log("data: " + JSON.stringify(data));
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
          // x11.eventMask.Exposure |
          x11.eventMask.StructureNotify |
          x11.eventMask.PointerMotion |
          x11.eventMask.ButtonPress |
          x11.eventMask.ButtonRelease
      } // other parameters
    );
    X.MapWindow(wid);
    console.log('wid: ', wid);
    // mpv --wid=106954753 --no-cache --untimed --no-demuxer-thread --vd-lavc-threads=1 tcp://192.168.78.132:13333 --no-input-cursor --no-input-default-bindings --no-config
    // var mplayer = spawn('mpv', [
    //   '--wid', wid,
    //   '--no-config',
    //   '--no-input-default-bindings',
    //   '--no-input-cursor',
    //   '--no-osd-bar', 
    //   '--no-cache',
    //   '--untimed',
    //   '--no-demuxer-thread',
    //   '--vd-lavc-threads=1',
    //   'tcp://192.168.78.132:13333']);

    var mpid;
    X.on('event', function (ev) {
      console.log("event: ", ev);
      try {
        if (ev.name == 'CreateNotify')
          mpid = ev.wid;
        if (ev.name == 'ConfigureNotify' && ev.wid == wid) {
          w = ev.width;
          h = ev.height;
          // X.ResizeWindow(mpid, ev.width, ev.height);
        }
        if (ev.name == 'MotionNotify' && ev.wid == wid) {
          let data = { type: 'move', x: ev.x * 1920 / w, y: ev.y * 1080 / h };
          // console.log(JSON.stringify(data));
          client.write(data);
        }
        if ((ev.name == 'ButtonPress' || ev.name == 'ButtonRelease') && (ev.keycode >= 1 && ev.keycode <= 3)) {
          let data = {
            type: 'button',
            button: ev.keycode == 1 ? 'left' : ev.keycode == 2 ? 'middle' : 'right',
            state: ev.name == 'ButtonPress' ? 'down' : 'up',
            x: ev.x * 1920 / w,
            y: ev.y * 1080 / h
          };
          console.log(JSON.stringify(data));
          client.write(data);
        }
        if((ev.name == 'ButtonPress') && (ev.keycode >= 4 && ev.keycode <= 5)) {
          let data = {
            type: 'scroll',
            // button: ev.keycode == 4 ? 'left' : ev.keycode == 2 ? 'middle' : 'right',
            // state: ev.name == 'ButtonPress' ? 'down' : 'up',
            x: 0,
            y: ev.keycode == 4? '10':'-10'
          };
          console.log(JSON.stringify(data));
          client.write(data);
        }
      } catch (err) {
        console.log("error: ", err);
      }

    });
  });
}

crateWindow();
