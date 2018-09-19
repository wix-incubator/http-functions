function parse(data) {
  if (data.type === 'httpFunctionResult') {
    return data.result;
  }
  return data;
}

export function httpFunctionsFetcher(endpoint, fileName, methodName) {
  return async function(...args) {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ fileName, methodName, args }),
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
      return Promise.reject(parse(data));
    }
    return parse(data);
  };
}
