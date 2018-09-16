import * as vm from 'vm';
import * as path from 'path';
import traverse from '@babel/traverse';
import { parse } from '@babel/parser';
import { getOptions } from 'loader-utils';

function getExports(source) {
  try {
    const exports = {};
    vm.runInNewContext(source, { exports, require });
    return Object.keys(exports);
  } catch (e) {
    const exports = [];
    const ast = parse(source, { sourceType: 'module' });
    traverse(ast, {
      ExportNamedDeclaration(p) {
        exports.push(p.node.declaration.id.name);
      },
    });
    return exports;
  }
}

export default function loader(source) {
  const { endpoint } = getOptions(this);
  const fileName = path.basename(this.resourcePath).replace(/\.(js|ts)$/, '');
  const header = `function fetcher(methodName) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return fetch('${endpoint}', {
      method: 'POST',
      body: JSON.stringify({fileName: '${fileName}', methodName: methodName, args: args}),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    }).then(function (response) {
      return response.json()
    }).then(function (data) {
      return data.result;
    });
  }
}`;
  const functions = getExports(source).map(fn => {
    return `export var ${fn} = fetcher('${fn}');`;
  });
  return [header, ...functions].join('\n\n');
}
