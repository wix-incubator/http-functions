import { handlers } from './handlers';

export function serialize(result, context = {}) {
  const handler = result && handlers.find(h => h.test(result));
  return handler ? handler.toJson(result, context) : result;
}

export function deserialize(result) {
  const handler = result && handlers.find(h => h.type === result.type);
  return handler ? handler.fromJson(result) : result;
}
