
var x11 = require('x11');
var jot = require('json-over-tcp');
var keysym = require('keysym');

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

var ks = x11.keySyms;
var ks2Name = {};
for (var key in ks)
  ks2Name[ks[key].code] = key;
var kk2Name = {};

var Modifiers = {
  17: 'shift',
  1: 'shift',
  20: 'control',
  4: 'control',
  24: 'alt',
  8: 'alt',
  21: ['shift', 'control'],
  5: ['shift', 'control'],
  25: ['shift', 'alt'],
  9: ['shift', 'alt'],
  28: ['control', 'alt'],
  12: ['control', 'alt'],
};

var KeyMaps = {
  return: 'enter',
  prior: 'pageup',
  next: 'pagedown',
  num_lock: '',
  caps_lock: '',
  grave: '`',
  comma: ',',
  less: ',',
  period: '.',
  greater: '.',
  slash: '/',
  question: '/',
  semicolon: ';',
  colon: ';',
  apostrophe: '\'',
  quotedbl: '\'',
  backslash: '\\',
  bar: '\\',
  bracketleft: '[',
  braceleft: '[',
  bracketright: ']',
  braceright: ']',
  minus: '-',
  underscore: '-',
  equal: '=',
  plus: '=',
};

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
          x11.eventMask.ButtonRelease |
          x11.eventMask.KeyPress |
          x11.eventMask.KeyRelease
      } // other parameters
    );
    X.MapWindow(wid);
    console.log('wid: ', wid);
    var args = [
      '--wid=' + wid,
      '--profile=low-latency',
      '--no-config',
      '--no-input-default-bindings',
      '--no-input-cursor',
      '--no-osd-bar',
      '--no-cache',
      '--untimed',
      '--no-correct-pts',
      // '--fps=30',
      'tcp://192.168.78.132:13333'];

    // mpv --wid=106954753 --no-cache --untimed --no-demuxer-thread --vd-lavc-threads=1 tcp://192.168.78.132:13333 --no-input-cursor --no-input-default-bindings --no-config --input-vo-keyboard=no
    var player = spawn('mpv', args, { stdio: ['ignore', 'inherit', 'inherit'] });

    var X = display.client;
    var min = display.min_keycode;
    var max = display.max_keycode;
    X.GetKeyboardMapping(min, max - min, function (err, list) {
      for (var i = 0; i < list.length; ++i) {
        var name = kk2Name[i + min] = [];
        var sublist = list[i];
        for (var j = 0; j < sublist.length; ++j)
          name.push([ks2Name[sublist[j]], sublist[j]]);
      }
    });

    var index = 0;

    var mpid;
    X.on('event', function (ev) {
      // if(ev.name !='MotionNotify' && ev.name != 'ConfigureNotify')
      //   console.log(index++ + " event: ", ev); 
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
            x: Math.round(ev.x * 1920 / w),
            y: Math.round(ev.y * 1080 / h)
          };
          console.log(JSON.stringify(data));
          client.write(data);
        }
        if ((ev.name == 'ButtonPress') && (ev.keycode >= 4 && ev.keycode <= 5)) {
          let data = {
            type: 'scroll',
            // button: ev.keycode == 4 ? 'left' : ev.keycode == 2 ? 'middle' : 'right',
            // state: ev.name == 'ButtonPress' ? 'down' : 'up',
            x: 0,
            y: ev.keycode == 4 ? '5' : '-5'
          };
          console.log(JSON.stringify(data));
          client.write(data);
        }
        if (ev.name == 'KeyPress' || ev.name == 'KeyRelease') {
          var keySyms = kk2Name[ev.keycode];
          // console.log(keySyms);
          var shift = ev.buttons == 17;// || ev.buttons == 18; // capslock
          var control = ev.buttons == 20;
          var alt = ev.buttons == 24;
          let name = '';
          if (keySyms) {
            var code = keysym.fromKeysym(keySyms[shift ? 1 : 0][1]);
            if (code === undefined) {
              code = keysym.fromKeysym(keySyms[0][1]);
            }
            if (code) {
              name = code.names[0].toLowerCase().replace(/_l$|_r$/, '');
            }
            if (KeyMaps[name] != undefined) name = KeyMaps[name];
          }
          if (name.length <= 0) return;
          let data = {
            type: 'keyboard',
            key: name,
            state: ev.name == 'KeyPress' ? 'down' : 'up',
            modifier: Modifiers[ev.buttons]
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
