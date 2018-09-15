import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { expect } from 'chai';
import compiler from './compiler';
import { httpFunctions } from 'http-functions-express';
import fetch from 'node-fetch';

declare const global: any;

describe('http-functions-webpack', () => {
  let server, bundle;

  before(() => (global.fetch = fetch));

  beforeEach(() => {
    const folder = path.resolve(__dirname, '../dist/test/backend');
    server = express()
      .use(bodyParser.json())
      .use('/api', httpFunctions(folder, /\.web\.js$/))
      .listen(3000);
  });

  afterEach(() => {
    fs.unlinkSync(bundle);
    server.close();
  });

  it('should know the answer', async () => {
    bundle = await compiler(
      path.resolve(__dirname, '../dist/test/backend/signature.web.js'),
    );
    const webMethods = require(bundle);
    expect(await webMethods.sign('the message')).to.eql(
      'bdfa78b6089865cbc03bc6bb13dc9ed2a5a2aa928d49b38baa85b12c65c4d09e',
    );
  });
});
