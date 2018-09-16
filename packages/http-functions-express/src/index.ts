import * as fs from 'fs';
import * as path from 'path';

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
      next(new Error('no such method'));
    } else if (!Array.isArray(req.body.args)) {
      next(new Error('invalid arguments'));
    } else {
      fn.apply({ req, res }, req.body.args)
        .then(result => res.send({ result }))
        .catch(error => next(error));
    }
  };
}
