import { toObject, fromObject } from 'errio';
import * as cloneDeepWith from 'lodash.clonedeepwith';

const classTag = '___http-functions-class___';

class SerializableError {
  error;
  options;
  constructor(error, options) {
    this.error = error;
    this.options = options;
  }
  toJSON() {
    return toObject(this.error, this.options);
  }
  static fromJSON(obj) {
    return fromObject(obj);
  }
}

const globalScope: any = typeof global === 'undefined' ? window : global;
const localScope = { SerializableError };

export function serialize(obj, options: any = {}) {
  return cloneDeepWith(obj, value => {
    if (value instanceof Error) {
      value = new SerializableError(value, { stack: options.stack !== false });
    }
    if (value && typeof value.toJSON === 'function') {
      return { json: value.toJSON(), [classTag]: value.constructor.name };
    }
  });
}

export function deserialize(obj) {
  return cloneDeepWith(obj, value => {
    if (value && value[classTag]) {
      const cls = globalScope[value[classTag]] || localScope[value[classTag]];
      if (cls) {
        return cls.fromJSON ? cls.fromJSON(value.json) : new cls(value.json);
      } else {
        return value.json;
      }
    }
  });
}
