import axios from 'axios';
import * as path from 'path';
import * as express from 'express';
import { expect } from 'chai';
import { httpFunctions } from '../src';

function invoke(fileName, methodName, args, headers?) {
  return axios.post(
    'http://localhost:3000/api',
    {
      fileName,
      methodName,
      args,
    },
    { validateStatus: () => true, headers },
  );
}

describe('http-functions-express', () => {
  let server;

  beforeEach(() => {
    const folder = path.resolve(__dirname, '../dist/test/backend');
    server = express()
      .use(express.json())
      .use('/api', httpFunctions(folder, /\.web\.js$/))
      .listen(3000);
  });

  afterEach(() => server.close());

  it('should invoke the web method', async () => {
    const { data } = await invoke('math.web', 'sum', [1, 2, 3]);
    expect(data).to.eql({ result: 6 });
  });

  it('should handle errors in web method', async () => {
    const { status, data } = await invoke('math.web', 'divide', [10, 0]);
    expect(status).to.eql(500);
    expect(data).to.contain('division by zero');
  });

  it('should get error if method does not exist', async () => {
    const { status, data } = await invoke('math.web', 'xxx', [10, 0]);
    expect(status).to.eql(500);
    expect(data).to.contain('no such method');
  });

  it('should get error if file does not exist', async () => {
    const { status, data } = await invoke('xxx.web', 'divide', [10, 0]);
    expect(status).to.eql(500);
    expect(data).to.contain('no such method');
  });

  it('should get error if args is not an array', async () => {
    const { status, data } = await invoke('math.web', 'sum', 0);
    expect(status).to.eql(500);
    expect(data).to.contain('invalid arguments');
  });

  it('should pass req on the context', async () => {
    const headers = { abc: 'def' };
    const { data } = await invoke('context.web', 'headers', [], headers);
    expect(data.result).to.include(headers);
  });

  it('should pass res on the context', async () => {
    const { status, data } = await invoke('context.web', 'status', [404]);
    expect(status).to.eql(404);
    expect(data).to.eql({ result: 'status 404' });
  });
});
