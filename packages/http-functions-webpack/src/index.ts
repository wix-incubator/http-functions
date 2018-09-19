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
  const parser = require.resolve('http-functions-parser');
  const fileName = path.basename(this.resourcePath).replace(/\.(js|ts)$/, '');
  const headers = [
    `import { httpFunctionsFetcher } from '${parser}';`,
    `var fetcher = httpFunctionsFetcher.bind(undefined, '${endpoint}', '${fileName}')`,
  ];
  const functions = getExports(source).map(fn => {
    return `export var ${fn} = fetcher('${fn}');`;
  });
  return [...headers, ...functions].join('\n\n');
}
