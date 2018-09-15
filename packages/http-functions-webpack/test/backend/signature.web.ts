import * as crypto from 'crypto';

export async function sign(str: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  const salt = 'shahata-rulez!!!';
  hash.update(salt + str);
  return hash.digest('hex');
}
