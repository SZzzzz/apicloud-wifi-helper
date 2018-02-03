import fse = require('fs-extra');
import path = require('path');

export const extractIP = (text: string | undefined): string => {
  if (!text) {
    return 'unkown';
  }
  const result =  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.exec(text);
  return result ? result[0] : 'unknown';
};

export const appDirectory: string = fse.realpathSync(process.cwd());
export const resolveApp = (relativePath: string): string => path.resolve(appDirectory, relativePath);

export const getConfig = (): SyncConfig => {
  const defaultConfig: SyncConfig = require('../config/wifisync.json');
  const customPath = appDirectory + '/wifisync.json';
  if (fse.pathExistsSync(customPath)) {
    return Object.assign(defaultConfig, require(customPath));
  } else {
    return defaultConfig;
  }
};

export interface SyncConfig {
  widgetPath: string;
  distSourcePath: string;
  distTargetPath: string;
  wifiLog: boolean;
  syncIgnore: string[];
  port: number;
}
