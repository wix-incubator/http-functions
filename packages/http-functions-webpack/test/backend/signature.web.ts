import * as crypto from 'crypto';

export async function sign(str) {
  const hash = crypto.createHash('sha256');
  const salt = 'shahata-rulez!!!';
  hash.update(salt + String(str));
  return hash.digest('hex');
}
