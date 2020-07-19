# p2pdesk

用于局域网远程控制，类似 TeamViewer 和 AnyDesk。

## 初始化

```bash
npm install
```

## 启动服务器端（受控端）

首先安装 ffmpeg：

linux(ubuntu)系统：

```bash
sudo apt install ffmpeg
```

windows 系统：

下载 ffmpeg <https://ffmpeg.zeranoe.com/builds/> ，解压后将 ffmpeg.exe 放在当前路径下。

最后，执行以下命令启动服务端：

```bash
node server.js
```

## 启动客户端（控制端）

linux(ubuntu) 系统：

```bash
node client.js <server-ip>
```

windows 系统：

下载windows客户端： <https://github.com/keyou/peerdesk-windows/releases>
