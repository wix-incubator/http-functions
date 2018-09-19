import { parse as parseAnsiColor } from 'ansicolor';

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
    return data.result;
  } else {
    return data;
  }
}

export function httpFunctionsFetcher(endpoint, fileName, methodName) {
  return async function(...args) {
    const response = await fetch(`${endpoint}/${fileName}/${methodName}`, {
      method: 'POST',
      body: JSON.stringify({ args }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    let data;
    if (response.headers.get('Content-Type').indexOf('json') === -1) {
      data = await response.text();
    } else {
      data = await response.json();
    }
    if (response.status >= 400) {
      return Promise.reject(parse(data, fileName, methodName));
    } else {
      return parse(data, fileName, methodName);
    }
  };
}
