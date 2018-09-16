import * as vm from 'vm';
import * as path from 'path';
import { getOptions } from 'loader-utils';

export default function loader(source) {
  const { endpoint } = getOptions(this);
  const fileName = path.basename(this.resourcePath).replace(/\.(js|ts)$/, '');
  const sandbox = { exports: {}, require };
  vm.runInNewContext(source, sandbox);

  const functions = Object.keys(sandbox.exports).map(fn => {
    return `export async function ${fn}(...args) {
      const response = await fetch('${endpoint}', {
        method: 'POST',
        body: JSON.stringify({fileName: '${fileName}', methodName: '${fn}', args}),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      const data = await response.json();
      return data.result;
    }`;
  });
  return [...functions].join('\n\n');
}
