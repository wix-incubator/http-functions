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
