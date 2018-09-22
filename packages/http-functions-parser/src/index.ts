import { convertors } from './convertors';
import * as cloneDeepWith from 'lodash.clonedeepwith';

const classTag = '___http-functions-class___';
const globalScope: any = typeof global === 'undefined' ? window : global;
const localScope = convertors.reduce(
  (scope, { to }) => ({
    ...scope,
    [to.prototype.constructor.name]: to,
  }),
  {},
);

export function addDataType(cls, from?) {
  localScope[cls.prototype.constructor.name] = cls;
  if (from) {
    convertors.push({ from, to: cls });
  }
}

export function toJSON(obj, options?: any) {
  return cloneDeepWith(obj, value => {
    const convertor = convertors.find(({ from }) => value instanceof from);
    if (convertor) {
      value = new convertor.to(value, options);
    }
    if (value && typeof value.toJSON === 'function') {
      return { [classTag]: value.constructor.name, json: value.toJSON() };
    }
  });
}

export function fromJSON(obj) {
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
