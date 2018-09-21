import * as path from 'path';
import * as express from 'express';
import { Writable } from 'stream';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { httpFunctions } from 'http-functions-express';
import { httpFunctionsFetcher } from '../src/fetcher';

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
  try {
    await fn();
  } finally {
    Object.assign(global.console, oldConsole);
  }
  return logs;
}

const fetcher = httpFunctionsFetcher.bind(
  undefined,
  '/_functions',
  'stuff.web',
);

describe('httpFunctionsFetcher', () => {
  let server;

  before(() => (global.XMLHttpRequest = XMLHttpRequest));

  beforeEach(() => {
    const folder = path.resolve(__dirname, '../dist/test/backend');
    server = express()
      .use(express.json())
      .use('/_functions', httpFunctions(folder, /\.web\.js$/))
      .listen(3000);
  });

  afterEach(() => {
    server.close();
  });

  it('should invoke the http function remotely', async () => {
    const sign = fetcher('sign');
    expect(await sign('the message')).to.eql(
      'bdfa78b6089865cbc03bc6bb13dc9ed2a5a2aa928d49b38baa85b12c65c4d09e',
    );
  });

  it('should show the server logs on the client', async () => {
    const logger = fetcher('logger');
    const logs = await hookConsole(() => logger());
    expect(logs).to.eql([
      { label: 'log', chunk: 'http function stuff.web/logger' },
      { label: 'error', chunk: '  shahata-rulez!!!' },
      { label: 'log', chunk: '  %cshahata-rulez!!! color:rgba(0,204,0,1);' },
    ]);
  });

  it('should serialize errors correctly', async () => {
    const thrower = fetcher('thrower');
    const err = await thrower('the message').catch(e => e);
    expect(err.toString()).to.eql('Error: the message');
    expect(err.stack).to.contain(
      'http-functions-webpack/test/backend/stuff.web.ts',
    );
  });
});
