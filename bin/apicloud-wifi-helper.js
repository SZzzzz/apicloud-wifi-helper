#!/usr/bin/env node

'use strict';
const { getConfig } = require('../lib/utils');
const FileHelper = require('../lib/FileHelper');

const config = getConfig();
const args = process.argv.slice(2);
const scriptIndex = args.findIndex(x => x === 'start');
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];

switch (script) {
  case 'start': {
    const fileHelper = new FileHelper(config);
    fileHelper.start();
    break;
  }
  default:
    console.log('Unknown script "' + script + '".');
    break;
}
