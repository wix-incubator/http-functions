import * as crypto from 'crypto';
import chalk from 'chalk';

const salt = 'shahata-rulez!!!';
const ctx = new chalk.constructor({ level: 1 });

export async function sign(str) {
  const hash = crypto.createHash('sha256');
  hash.update(salt + String(str));
  return hash.digest('hex');
}

export async function logger() {
  this.console.error(salt);
  this.console.log(ctx.green(salt));
}

export async function thrower(str) {
  throw new Error(str);
}
