import { SyncConfig, appDirectory } from "./utils";
import fse = require('fs-extra');
import chalk from 'chalk';
import WifiHelper = require('./WifiHelper');
import glob = require('glob');
import path = require('path');
import chokidar = require('chokidar');

class FileHelper {
  private _autoCopy: boolean = true;

  private _wifiHelper: WifiHelper;

  private _watcher: chokidar.FSWatcher;

  private _timer: NodeJS.Timer;

  private _widgetPath: string;

  private _sourcePath: string;

  private _targetPath: string;

  private _igonreList: string[];

  private _appId: string;

  private _port: number;

  // 监听目录, autoCopy 模式监听 distSource 目录, 否则监听 widget 目录
  watch() {
    const path = this._autoCopy ? this._sourcePath : this._widgetPath;
    this._watcher = chokidar.watch(path, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    }).on('all', () => {
      // 所有事件结束后 2s 内执行
      clearTimeout(this._timer);      
      this._timer = setTimeout(() => this.sync(), 1000);
    });
  }

  sync(): void {
    // 自动监听模式, 则把 distSource 复制进 widget 中的 distTarget 目录
    if (this._autoCopy) {
      this.copyDist();
    }

    // 获取需要同步的文件列表, 一个完整的 widget 目录, 
    const fileList = this.glob(this._widgetPath);
    // 调用同步方法
    this._wifiHelper.sync(fileList);
  }

  copyDist(): void {
    if (!fse.pathExistsSync(this._sourcePath)) {
      console.log(chalk.red(`${this._sourcePath} 不存在, 复制失败`));
      return;
    }
    fse.removeSync(this._targetPath);
    const fileList = this.glob(this._sourcePath);
    fileList.forEach((file: string) => {
      const relativePath = path.relative(this._sourcePath, file);
      fse.copySync(file, path.resolve(this._targetPath, relativePath));
    });
  }

  glob(cwd: string) {
    return glob.sync('**', {
      cwd: cwd,
      ignore: this._igonreList,
      nodir: true,
      realpath: true,
      nosort: true,
    });
  }

  validateWidget(widgetPath: string) {
    if (!fse.pathExistsSync(widgetPath)) {
      chalk.red(`widgetPath: ${widgetPath} 不存在, 请检查`);
      return false
    }
    const configPath = path.resolve(widgetPath, "config.xml");
    if (!fse.pathExistsSync(configPath)) {
      chalk.red(`widgetPath 中缺少 config.xml 文件, 请检查`);
      return false
    }
    const configText = fse.readFileSync(configPath, 'utf8');
    const appIdInfo = configText.match(/widget.*id.*=.*(A[0-9]{13})\"/);
    if (!appIdInfo || !appIdInfo[1]) {
      chalk.red(`config.xml 文件中缺少 id 信息, 请检查`);
      return false
    }
    this._appId = appIdInfo![1];
    return true;
  }

  start(): void {
    this._wifiHelper.start(this._port);    
    this.sync();
  }

  constructor(config: SyncConfig) {
    this._port = config.port;
    this._widgetPath = path.resolve(appDirectory, config.widgetPath);
    this._sourcePath = path.resolve(appDirectory, config.distSourcePath);
    this._targetPath = path.resolve(appDirectory, config.distTargetPath);
    this._igonreList = config.syncIgnore;    
    if (!this.validateWidget(this._widgetPath)) {
      process.exit(1);
    }
    if (!config.distSourcePath) {
      console.log(chalk.red(`缺少 distSourcePath, 自动复制功能关闭`));
      this._autoCopy = false;
    }
    if (!config.distTargetPath) {
      console.log(chalk.red(`缺少 distTargetPath, 自动复制功能关闭`));
      this._autoCopy = false;
    }
    
    this.watch();
    
    this._wifiHelper = new WifiHelper(this._appId, this._widgetPath);    
  }
}

export = FileHelper;