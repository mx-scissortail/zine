import fs from 'fs';
import path from 'path';
import register from 'babel-register';

import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter: new Adapter()});

const rcPath = path.join(__dirname, '..', '.babelrc');
const source = fs.readFileSync(rcPath).toString();
const config = JSON.parse(source);

config.ignore = (filename) => (/\/node_modules\//).test(filename);

register(config);
