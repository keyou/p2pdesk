
var robot = require('robotjs');
var jot = require('json-over-tcp');

var spawn = require('child_process').spawn;

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

const server = jot.createServer();

server.on('error', (err) => {
  console.log("error: "+ err);
  process.exit(-1);
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
  setTimeout(() => {  
    console.log('server start.');
    console.log('listen at: tcp://0.0.0.0:13334');
  }, 500);
});

// ffmpeg -f x11grab -s 1920x1080 -framerate 30 -i :0.0 -preset ultrafast -pix_fmt yuv420p -vcodec libx264 -tune zerolatency -b:v 900k -threads 1 -g 120 -listen 1 -fflags nobuffer -f h264 tcp://0.0.0.0:13333?tcp_nodelay


var args = [
  '-f',
  'x11grab',
  // '-s','1280x720',
  '-s', '1920x1080',
  '-i', ':0.0',
  '-framerate', '30',
  '-crf','25', // 质量 1-51,越小质量越高，体积越大
  // '-vsync', '1', // for 'Past duration * too large'，可能会导致起播慢
  '-draw_mouse', '1',
  // '-show_region','1',
  '-preset', 'ultrafast',
  '-pix_fmt', 'yuv420p',
  // '-pix_fmt','+gray',
  // '-codec:v','libx264',
  '-codec:v', 'libx265',
  '-tune', 'zerolatency',
  '-b:v', '900k',
  '-threads', '1',
  // '-g','120',
  '-listen', '1',
  '-fflags', 'nobuffer',
  '-nostdin',
  '-f', 'mpegts',
  // '-f','hevc', // 使用该格式会导致起播很慢
  'tcp://0.0.0.0:13333?tcp_nodelay'
  // 'pipe:1'
];
console.log("ffmpeg args:", args);

var respawn = child => {
  child.on("exit", (code) => {
    console.error('ffmpeg exit: ' + code);
    setTimeout(() => {
      console.error('ffmpeg respawn.');
      respawn(spawn('ffmpeg', args, { stdio: 'inherit' }));
    }, 2000);
  });
};
respawn(spawn('ffmpeg', args, { stdio: 'inherit' }));
