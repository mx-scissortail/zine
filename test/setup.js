import fs from 'fs';
import path from 'path';
import register from 'babel-register';

import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter: new Adapter()});

// Ignore all node_modules except these
const modulesToCompile = [
  'zine',
  'zine/react'
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
