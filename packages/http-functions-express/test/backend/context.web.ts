export async function headers() {
  return this.req.headers;
}

export async function status(code) {
  this.res.status(code);
  return `status ${code}`;
}

export async function send(str) {
  this.res.send(str);
  return 'should be ignored';
}

export async function log(str) {
  this.console.log(`log: ${str}`);
  this.console.error(`err: ${str}`);
  return str;
}

export async function yo() {
  return this.yo;
}
