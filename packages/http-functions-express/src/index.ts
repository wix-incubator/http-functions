import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

export function httpFunctionResult(result) {
  return {
    type: 'httpFunctionResult',
    result: util.isError(result) ? result.toString() : result,
  };
}

export function httpFunctions(folder, test) {
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

  return async (req, res, next) => {
    const { fileName, methodName } = req.body;
    const fn = files[fileName] && files[fileName][methodName];

    if (!fn) {
      res.status(404).send(httpFunctionResult(new Error('no such method')));
    } else if (!Array.isArray(req.body.args)) {
      res.status(400).send(httpFunctionResult(new Error('invalid arguments')));
    } else {
      fn.apply({ req, res }, req.body.args)
        .then(result => {
          if (!res.headersSent) {
            res.send(httpFunctionResult(result));
          }
        })
        .catch(result => {
          if (!res.headersSent) {
            res.status(500).send(httpFunctionResult(result));
          }
        });
    }
  };
}
