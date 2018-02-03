import http = require('http');
import ws = require('ws');
import { extractIP } from './utils';
const v4 = require('internal-ip').v4 as V4;
import chalk from 'chalk';
import fse = require('fs-extra');
import path = require('path');
import BiMap = require('./BiMap');
import SyncRecord = require('./SyncRecord');
import TaskManager = require('./TaskManager');

interface V4 {
  sync: () => string;
  (): string;
}

interface IClientCache {
  outdated: boolean;
  record: Map<string, string>
}

enum COMMANDS {
  CLI_COMMAND = -1,
  S_APP_ID_COMMAND = 1,
  C_TIMESTAMP_COMMAND = 2,
  S_FILELIST_COMMAND = 3,
  C_HEARTBEAT_COMMAND = 4,
  S_PORT_COMMAND = 7,
  C_ERROR_REPORT = 8
};

interface CustomWS extends ws {
  ip: string;
}

class WifiHelper {
  httpServer: http.Server;

  wsServer: ws.Server;

  private _ip: string;

  private _port: string;

  private _running: boolean = false;

  private _appId: string;

  private _widgetPath: string;

  // 真实路径与虚拟路径的映射
  private _pathMap: BiMap<string, string> = new BiMap<string, string>();

  // 同步记录
  private _syncRecord: SyncRecord = new SyncRecord();

  // 客户端记录
  private _clientRecord: Map<string, number> = new Map();

  // 更新任务管理
  private _taskManager: TaskManager = new TaskManager();

  // 启动服务
  start(port = 10915): void {

    if(this._running) {
      console.log(`同步服务器正在运行中, ip: ${chalk.red(this._ip)}, port: ${chalk.red(this._port)}`);
      return;
    }

    const server = http.createServer((req, res) => {
      const virtualPath = req.url;
      if (!virtualPath) {
        res.writeHead(404, {"Content-Type": "text/plain"})
        res.write("404 Not found")
        res.end();
      } else {
        const realPath = this._pathMap.val(virtualPath);
        if (realPath && fse.pathExistsSync(realPath)) {
          fse.createReadStream(realPath).pipe(res);
          res.on('finish', () => {
            // TODO 更新 task
            this._taskManager.updateTask(extractIP(req.connection.remoteAddress), virtualPath);
          })
        }
      }
    });

    const wsServer = new ws.Server({server});

    this.httpServer = server;
    this.wsServer = wsServer;

    wsServer.on('connection', this.handleConnection.bind(this));

    this._ip = v4.sync();
    this._port = String(port);
    server.listen(port, () => {
      console.log(chalk.cyan(`listening on ip: ${chalk.red(this._ip)}, port: ${chalk.red(this._port)}`))
    });
    this._running = true;
  }

  handleConnection(socket: ws & {ip: string}, req: http.IncomingMessage): void {
    const clientIP = extractIP(req.connection.remoteAddress);
    socket.ip = clientIP;
    console.log(chalk.green(`客户端: ${clientIP} 已连接`));
 
    // todo 试试这里能不能删掉
    socket.send(JSON.stringify({
      command: COMMANDS.S_PORT_COMMAND,
      port: this._port
    }));

    socket.on('message', (message: string) => {
      const cmd = JSON.parse(message);
      if (cmd.command === COMMANDS.C_ERROR_REPORT) {
        console.log(chalk.red(`${cmd.level}: ${cmd.content}`));
      } 
      if (cmd.command === COMMANDS.C_HEARTBEAT_COMMAND) {
        socket.send(JSON.stringify({
          command: COMMANDS.C_HEARTBEAT_COMMAND
        }));
      }
    })

    socket.on('error', err => {});

    socket.on('close', () => {
      console.log(chalk.yellow(`客户端: ${clientIP} 已断开`));  
    })

    this.handleClient(socket, clientIP);
  }

  handleClient(socket: ws, ip: string) {
    // 没有同步数据或者已经是最新的
    if (this._syncRecord.length === 0 || this._clientRecord.get(ip) === this._syncRecord.length - 1) {
      return;
    }
    const vFileList = this._syncRecord.diff(this._clientRecord.get(ip)).map(realPath => this._pathMap.key(realPath)!);
    
    const lastIndex = this._syncRecord.length - 1;
    // 完成后再记录
    this._taskManager.addTask(ip, vFileList, () => {
      this._clientRecord.set(ip, lastIndex);          
    })
    this.command3(
      socket, 
      vFileList
    );
  }

  // 关闭服务
  end(): void {
    if (!this._running) {
      console.log(chalk.red('APICloud WIFi 同步服务器未开启.'));
    }
    this.httpServer.close();
    this.wsServer.close();
    console.log(chalk.red('APICloud WIFi 同步服务器已关闭.'));
  }

  // 同步
  sync(fileList: string[]): void {
    // 所有的客户端都标记为过期
    // this._clientMap.forEach(client => client.outdated = true);
    if (!this._running) {
      this.start();
    }

    // 建立路径映射
    fileList
      .filter(realpath => !this._pathMap.hasKey(realpath))
      .map(realPath => {
        const virtualPath = path.resolve(`/${this._appId}`,path.relative(this._widgetPath, realPath));
        return [realPath, virtualPath] as [string, string];
      })
      .forEach(item => this._pathMap.push(item[0], item[1]));

    // 存储同步记录
    this._syncRecord.push(fileList);

    // 对在线的客户端进行广播
    this.wsServer.clients.forEach((socket: ws & {ip: string}) => {
      this.handleClient(socket, socket.ip);
    });
  }

  command3(socket: ws, vFlieList: string[]): void {
    socket.send(JSON.stringify({
      command: COMMANDS.S_FILELIST_COMMAND,
      list: vFlieList,
      timestamp: Math.floor(Date.now() / 1000)
    }));
  }

  constructor(appId: string, widgetPath: string) {
    this._appId = appId;
    this._widgetPath = widgetPath;
  }
}

export = WifiHelper;