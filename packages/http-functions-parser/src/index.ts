import { convertors } from './convertors';
import * as cloneDeepWith from 'lodash.clonedeepwith';

const classTag = '___http-functions-class___';
const referenceTag = '___http-function-reference___';
const pointerTag = '___http-function-pointer___';
const globalScope: any = typeof global === 'undefined' ? window : global;
const localScope = convertors.reduce(
  (scope, { to }) => ({
    ...scope,
    [to.prototype.constructor.name]: to,
  }),
  {},
);

let referenceId = 0;
const MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
function nextReferenceId() {
  if (referenceId === MAX_SAFE_INTEGER) {
    referenceId = 0;
  }
  return ++referenceId;
}

export function addDataType(cls, from?) {
  localScope[cls.prototype.constructor.name] = cls;
  if (from) {
    convertors.push({ from, to: cls });
  }
}

export function toJSON(obj, options?: any) {
  return cloneDeepWith(obj, (value, index, object, stack) => {
    const stacked = stack && stack.get(value);
    if (stacked) {
      stacked[referenceTag] =
        stacked[referenceTag] || `REF_${nextReferenceId()}`;
      return { [pointerTag]: stacked[referenceTag] };
    }
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
  const references = {};
  const pointers = [];
  const result = cloneDeepWith(obj, (value, index, object, stack) => {
    if (value) {
      if (value[pointerTag]) {
        pointers.push({
          pointer: value[pointerTag],
          object: stack.get(object),
          index,
        });
      } else if (index === referenceTag) {
        references[value] = stack.get(object);
      } else if (value[classTag]) {
        const cls = globalScope[value[classTag]] || localScope[value[classTag]];
        if (cls) {
          return cls.fromJSON ? cls.fromJSON(value.json) : new cls(value.json);
        } else {
          return value.json;
        }
      }
    }
  });
  pointers.forEach(({ pointer, object, index }) => {
    object[index] = references[pointer];
    delete references[pointer][referenceTag];
  });
  return result;
}
