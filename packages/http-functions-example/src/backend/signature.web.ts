import * as crypto from 'crypto';

export async function sign(str: string): Promise<string> {
  this.console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
  this.console.dir(
    { a: { b: { c: [1, 2, 3] }, d: 'a' } },
    { colors: true, depth: 10 },
  );
  const hash = crypto.createHash('sha256');
  const salt = 'shahata-rulez!!!';
  hash.update(salt + str);
  return hash.digest('hex');
}
