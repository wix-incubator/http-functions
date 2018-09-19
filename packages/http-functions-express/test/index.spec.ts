import axios from 'axios';
import * as path from 'path';
import * as express from 'express';
import { expect } from 'chai';
import { httpFunctions, httpFunctionResult } from '../src';

function invoke(fileName, methodName, args, headers?) {
  return axios.post(
    `http://localhost:3000/_functions/${fileName}/${methodName}`,
    { args },
    { validateStatus: () => true, headers },
  );
}

describe('http-functions-express', () => {
  let server;

  beforeEach(() => {
    const folder = path.resolve(__dirname, '../dist/test/backend');
    server = express()
      .use(express.json())
      .use(
        '/_functions',
        httpFunctions(folder, /\.web\.js$/, (req, res) => {
          return { yo: req.headers.yo };
        }),
      )
      .listen(3000);
  });

  afterEach(() => server.close());

  it('should invoke the web method', async () => {
    const { data } = await invoke('math.web', 'sum', [1, 2, 3]);
    expect(data).to.eql(httpFunctionResult(6));
  });

  it('should handle errors in web method', async () => {
    const { status, data } = await invoke('math.web', 'divide', [10, 0]);
    expect(status).to.eql(500);
    expect(data).to.eql(httpFunctionResult(new Error('division by zero')));
  });

  it('should get error if method does not exist', async () => {
    const { status, data } = await invoke('math.web', 'xxx', [10, 0]);
    expect(status).to.eql(404);
    expect(data).to.eql(httpFunctionResult(new Error('no such method')));
  });

  it('should get error if file does not exist', async () => {
    const { status, data } = await invoke('xxx.web', 'divide', [10, 0]);
    expect(status).to.eql(404);
    expect(data).to.eql(httpFunctionResult(new Error('no such method')));
  });

  it('should get error if not post method', async () => {
    const { status, data } = await axios.put(
      `http://localhost:3000/_functions/math.web/divide`,
      { args: [10, 2] },
      { validateStatus: () => true },
    );
    expect(status).to.eql(404);
    expect(data).to.eql(httpFunctionResult(new Error('no such method')));
  });

  it('should get error if args is not an array', async () => {
    const { status, data } = await invoke('math.web', 'sum', 0);
    expect(status).to.eql(400);
    expect(data).to.eql(httpFunctionResult(new Error('invalid arguments')));
  });

  it('should pass req on the context', async () => {
    const headers = { abc: 'def' };
    const { data } = await invoke('context.web', 'headers', [], headers);
    expect(data.result).to.include(headers);
  });

  it('should pass res on the context', async () => {
    const { status, data } = await invoke('context.web', 'status', [201]);
    expect(status).to.eql(201);
    expect(data).to.eql(httpFunctionResult('status 201'));
  });

  it('should pass custom context', async () => {
    const headers = { yo: 'hello' };
    const { data } = await invoke('context.web', 'yo', [], headers);
    expect(data).to.eql(httpFunctionResult('hello'));
  });

  it('should allow function to handle response sending', async () => {
    const { data } = await invoke('context.web', 'send', ['hello']);
    expect(data).to.eql('hello');
  });

  it('should send logs back to client', async () => {
    const { data } = await invoke('context.web', 'log', ['hello']);
    expect(data).to.eql(
      httpFunctionResult('hello', {
        logs: [
          { label: 'log', chunk: 'log: hello' },
          { label: 'error', chunk: 'err: hello' },
        ],
      }),
    );
  });
});
