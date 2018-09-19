import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { Writable } from 'stream';

function inMemoryStream(label, arr) {
  return new Writable({
    write(chunk, encoding, callback) {
      arr.push({ label, chunk: chunk.toString().replace(/\n$/, '') });
      callback(null);
    },
  });
}

export function httpFunctionResult(result, context?) {
  return {
    type: 'httpFunctionResult',
    logs: context ? context.logs : [],
    result: util.isError(result) ? result.toString() : result,
  };
}

function defaultContextBuilder(req, res) {
  const logs = [];
  const stdout = inMemoryStream('log', logs);
  const stderr = inMemoryStream('error', logs);
  const aConsole = new console.Console(stdout, stderr);
  return { req, res, console: aConsole, logs };
}

export function httpFunctions(
  folder,
  test,
  contextBuilder = (req, res) => ({}),
) {
  const files = fs
    .readdirSync(folder)
    .filter(fileName => fileName.match(test))
    .map(fileName => fileName.replace(/\.(js|ts)$/, ''))
    .reduce(
      (obj, fileName) => ({
        ...obj,
        [fileName]: require(path.join(folder, fileName)),
      }),
      {},
    );

  return async (req, res) => {
    const [, fileName, methodName] = req.path.split('/');
    const fn =
      req.method === 'POST' && files[fileName] && files[fileName][methodName];
    const context = {
      ...defaultContextBuilder(req, res),
      ...contextBuilder(req, res),
    };

    if (!fn) {
      res.status(404).send(httpFunctionResult(new Error('no such method')));
    } else if (!Array.isArray(req.body.args)) {
      res.status(400).send(httpFunctionResult(new Error('invalid arguments')));
    } else {
      fn.apply(context, req.body.args)
        .then(result => {
          if (!res.headersSent) {
            res.send(httpFunctionResult(result, context));
          }
        })
        .catch(result => {
          if (!res.headersSent) {
            res.status(500).send(httpFunctionResult(result, context));
          }
        });
    }
  };
}
