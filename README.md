# 本工具是用于 APiCloud 项目的 WiFi 同步工具

## 使用方法
1. 在设备上安装 APiCloud 提供的 APP Loader.

2. 安装 apicloud-wifi-helper:  
`yarn add apicloud-wifi-helper --dev`  
or  
`npm install apicloud-wifi-helper --dev`  

3. 写入 npm scripts  
```
// package.json
{
  "scripts": {
    "apicloud": "apicloud-wifi-helper start"
  }
}
```

4. 配置文件  
在项目根目录下新建 `wifisync.json` 文件, 包含以下配置项:  
- widgetPath(default: ./widget/)(必填): APiCloud widget 包的相对于项目根目录的相对路径.
- port(default: 10915): 端口设置.
- distSourcePath(default: ./dist): 构建工具的输出路径.
- distTargetPath(default: ./widget/dist): 构建好的代码再 widget 中的位置.
- syncIgnore(default: []) 同步时忽略的文件, 使用 glob 匹配.

如果 `distSourcePath` 和 `distTargetPath` 未填写的话, 将监听 widget 目录, 在文件发生变化后触发同步, 否则会监听 distSourcePath 目录, 在文件发生变化后复制到 distSourcePath 后触发同步.

如果不需要自动复制功能的话请在 `wifisync.json` 文件设置:  

```
// wifisync.json
{
  "distSourcePath": "",
  "distTargetPath": ""
}
```


5. 启动服务  
确保装有 APP Loader 的移动设备和开发机在同一 WIFi 中, 运行 `yarn run apicloud` 或者 `npm run apicloud`, 在手机上按照显示的 IP 地址和端口连接即可.
