import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import { Writable } from 'stream';
import { expect } from 'chai';
import compiler from './compiler';
import { httpFunctions } from 'http-functions-express';
import { JSDOM } from 'jsdom';

declare const global: any;
const { XMLHttpRequest } = new JSDOM('', {
  url: 'http://localhost:3000/',
}).window;

function inMemoryStream(label, arr) {
  return new Writable({
    write(chunk, encoding, callback) {
      arr.push({ label, chunk: chunk.toString().replace(/\n$/, '') });
      callback(null);
    },
  });
}

async function hookConsole(fn) {
  const logs = [];
  const stdout = inMemoryStream('log', logs);
  const stderr = inMemoryStream('error', logs);
  const oldConsole = { ...global.console };
  const newConsole = new console.Console(stdout, stderr);
  Object.assign(global.console, newConsole);
  await fn();
  Object.assign(global.console, oldConsole);
  return logs;
}

describe('http-functions-webpack', () => {
  let server, bundle;

  before(() => (global.XMLHttpRequest = XMLHttpRequest));

  beforeEach(() => {
    const folder = path.resolve(__dirname, '../dist/test/backend');
    server = express()
      .use(express.json())
      .use('/_functions', httpFunctions(folder, /\.web\.js$/))
      .listen(3000);
  });

  afterEach(() => {
    fs.unlinkSync(bundle);
    server.close();
  });

  it('should invoke the http function remotely', async () => {
    bundle = await compiler(
      path.resolve(__dirname, '../dist/test/backend/signature.web.js'),
    );
    const webMethods = require(bundle);
    expect(await webMethods.sign('the message')).to.eql(
      'bdfa78b6089865cbc03bc6bb13dc9ed2a5a2aa928d49b38baa85b12c65c4d09e',
    );
  });

  it('should handle esnext modules correctly', async () => {
    bundle = await compiler(
      path.resolve(__dirname, './backend/signature.web.ts'),
    );
    const webMethods = require(bundle);
    expect(await webMethods.sign('the message')).to.eql(
      'bdfa78b6089865cbc03bc6bb13dc9ed2a5a2aa928d49b38baa85b12c65c4d09e',
    );
  });

  it('should show the server logs on the client', async () => {
    bundle = await compiler(
      path.resolve(__dirname, './backend/signature.web.ts'),
    );
    const webMethods = require(bundle);
    const logs = await hookConsole(() => webMethods.logger());
    expect(logs).to.eql([
      { label: 'log', chunk: 'http function signature.web/logger' },
      { label: 'error', chunk: '  shahata-rulez!!!' },
      { label: 'log', chunk: '  %cshahata-rulez!!! color:rgba(0,204,0,1);' },
    ]);
  });
});
