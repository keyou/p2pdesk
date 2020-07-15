
var x11 = require('x11');
var robot = require('robotjs');
var jot = require('json-over-tcp');

var spawn = require('child_process').spawn;

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

const server = jot.createServer();

server.on('error', (err) => {
  throw err;
});

server.on('connection', (client) => {
  console.log('client connected');
  client.on('end', () => {
    console.log('client disconnected');
  });
  client.on('data', (data) => {
    try {
      if (data.type != 'move')
        console.log(JSON.stringify(data));
      if (data.type == 'move') robot.moveMouse(data.x, data.y);
      if (data.type == 'button') robot.mouseToggle(data.state, data.button);
      if (data.type == 'scroll') robot.scrollMouse(data.x, data.y);
      if (data.type == 'keyboard') {
        if (data.modifier && String(data.modifier).length > 0)
          robot.keyToggle(data.key, data.state, data.modifier);
        else robot.keyToggle(data.key, data.state);
      }
      // if(data.type == 'click') robot.mouseClick(data.button,data.x,data.y);
      // if(data.type == 'drag') robot.dragMouse(data.x,data.y);
    } catch (error) {
      console.error(error);
    }
  });
});

server.listen(13334, () => {
  console.log('server start');
});

// ffmpeg -f x11grab -s 1920x1080 -framerate 30 -i :0.0 -preset ultrafast -pix_fmt yuv420p -vcodec libx264 -tune zerolatency -b:v 900k -threads 1 -g 120 -listen 1 -fflags nobuffer -f h264 tcp://0.0.0.0:13333?tcp_nodelay


var args = [
  '-f',
  'x11grab',
  // '-s','1280x720',
  '-s','1920x1080',
  '-i',':0.0',
  '-framerate','30',
  '-draw_mouse','1',
  // '-show_region','1',
  '-preset','ultrafast',
  '-pix_fmt','yuv420p',
  // '-pix_fmt','+gray',
  // '-codec:v','libx264',
  '-codec:v','libx265',
  '-tune','zerolatency',
  '-b:v','900k',
  '-threads','1',
  // '-g','120',
  '-listen','1',
  '-fflags','nobuffer',
  '-nostdin',
  // '-f','mpegts',
  '-f','hevc',
  'tcp://0.0.0.0:13333?tcp_nodelay'
  // 'pipe:1'
];
console.log("ffmpeg args:", args);

var respawn = child => {
  child.on("exit",(code)=>{
    console.error('ffmpeg exit: '+code);
    setTimeout(() => {
      console.error('ffmpeg respawn.');
      respawn(spawn('ffmpeg', args, { stdio: 'inherit' }));
    }, 3000);
  });
};
respawn(spawn('ffmpeg', args, { stdio: 'inherit' }));

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
