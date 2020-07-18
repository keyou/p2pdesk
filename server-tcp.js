
var robot = require('robotjs');
var jot = require('net');
var spawn = require('child_process').spawn;

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

let screen_with = 1920
let screen_height= 1080;

const server = jot.createServer();
server.on('error', (err) => {
  console.log("error: "+ err);
  process.exit(-1);
});

server.on('connection', (client) => {
  console.log('client connected');
  client.write("2222222");
  client.on('end', () => {
    console.log('client disconnected');
  });
  client.on('data', (data) => {
    try {
        parseData(data,cmd=>{
          cmd = JSON.parse(cmd);
          if(cmd.type!='move') console.log("cmd: "+JSON.stringify(cmd));
          if (cmd.type == 'move') robot.moveMouse(cmd.x, cmd.y);
          if (cmd.type == 'button') robot.mouseToggle(cmd.state, cmd.button);
          if (cmd.type == 'scroll') robot.scrollMouse(cmd.x, cmd.y);
          if (cmd.type == 'keyboard') {
            if (cmd.modifier && String(cmd.modifier).length > 0)
              robot.keyToggle(cmd.key, cmd.state, cmd.modifier);
            else robot.keyToggle(cmd.key, cmd.state);
          }
          // if(cmd.type == 'click') robot.mouseClick(cmd.button,cmd.x,cmd.y);
          // if(cmd.type == 'drag') robot.dragMouse(cmd.x,cmd.y);
        });
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

var buffer = '';
function parseData(data,callback) {
  buffer += data.toString();
  var commands = buffer.split('\n');
  buffer = commands[commands.length-1];
  commands = commands.slice(0,commands.length-1);
  commands.forEach(callback);
}

// ffmpeg -f x11grab -s 1920x1080 -framerate 30 -i :0.0 -preset ultrafast -pix_fmt yuv420p -vcodec libx264 -tune zerolatency -b:v 900k -threads 1 -g 120 -listen 1 -fflags nobuffer -f h264 tcp://0.0.0.0:13333?tcp_nodelay

var args = [
  '-f',
  'x11grab',
  // '-s','1280x720',
  '-s', `${screen_with}x${screen_height}`,
  '-i', ':0.0',
  '-framerate', '30',
  '-crf','45', // 质量 1-51,越小质量越高，体积越大
  // '-vsync', '1', // for 'Past duration * too large'，可能会导致起播慢
  '-draw_mouse', '1',
  // '-show_region','1',
  '-preset', 'ultrafast',
  '-pix_fmt', 'yuv420p',
  // '-pix_fmt','+gray',
  // '-codec:v','libx264',
  '-codec:v', 'libx264',
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
