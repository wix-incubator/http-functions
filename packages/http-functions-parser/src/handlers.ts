import * as util from 'util';
import { toObject, fromObject } from 'errio';

export const handlers = [
  {
    type: 'ErrorSerializer',
    toJson(err, context) {
      const stack = context.stack !== false;
      return { type: 'ErrorSerializer', err: toObject(err, { stack }) };
    },
    fromJson(obj) {
      return fromObject(obj.err);
    },
    test: result => util.isError(result),
  },
];
