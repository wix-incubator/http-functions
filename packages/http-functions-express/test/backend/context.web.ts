export async function headers() {
  return this.req.headers;
}

export async function status(code) {
  this.res.status(code);
  return `status ${code}`;
}
