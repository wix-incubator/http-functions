import { parse as parseAnsiColor } from 'ansicolor';
import { handlers } from './handlers';

export function serialize(result, context = {}) {
  const handler = result && handlers.find(h => h.test(result));
  return handler ? handler.toJson(result, context) : result;
}

export function deserialize(result) {
  const handler = result && handlers.find(h => h.type === result.type);
  return handler ? handler.fromJson(result) : result;
}

function colorize(str) {
  const args = parseAnsiColor(str).asChromeConsoleLogArguments;
  if (args.length === 2 && args[1] === '') {
    return [str];
  } else {
    return args;
  }
}

function parse(data, fileName, methodName) {
  if (data.type === 'httpFunctionResult') {
    if (data.logs.length > 0) {
      console.groupCollapsed(`http function ${fileName}/${methodName}`);
      data.logs.forEach(log => {
        console[log.label](...colorize(log.chunk));
      });
      console.groupEnd();
    }
    return deserialize(data.result);
  } else {
    return data;
  }
}

export function httpFunctionsFetcher(endpoint, fileName, methodName) {
  return async function(...args) {
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          let data;
          if (
            (xhr.getResponseHeader('Content-Type') || '').indexOf('json') === -1
          ) {
            data = xhr.responseText;
          } else {
            data = JSON.parse(xhr.responseText);
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parse(data, fileName, methodName));
          } else {
            reject(parse(data, fileName, methodName));
          }
        }
      };

      xhr.onerror = function(e) {
        reject(e);
      };

      xhr.withCredentials = true;
      xhr.open('POST', `${endpoint}/${fileName}/${methodName}`, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(serialize({ args })));
    });
  };
}
