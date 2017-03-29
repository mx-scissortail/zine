import fs from 'fs';
import path from 'path';
import register from 'babel-core/register';

// Ignore all node_modules except these
const modulesToCompile = [
  'zine'
].map((moduleName) => new RegExp(`/node_modules/${moduleName}`));

const rcPath = path.join(__dirname, '..', '.babelrc');
const source = fs.readFileSync(rcPath).toString();
const config = JSON.parse(source);

config.ignore = function(filename) {
  if (!(/\/node_modules\//).test(filename)) {
    return false;
  } else {
    const matches = modulesToCompile.filter((regex) => regex.test(filename));
    const shouldIgnore = matches.length === 0;
    return shouldIgnore;
  }
}

register(config);

global.assert = require('assert');
