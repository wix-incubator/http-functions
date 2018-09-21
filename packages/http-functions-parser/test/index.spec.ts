import { expect } from 'chai';
import { serialize, deserialize } from '../src';

function fullCycle(obj, options?) {
  return deserialize(JSON.parse(JSON.stringify(serialize(obj, options))));
}

function produceError() {
  return new Error('message');
}

describe('http-functions-parser', () => {
  it('should serialize errors', () => {
    const error = fullCycle(new Error('message'));
    expect(error).to.be.instanceof(Error);
    expect(error.toString()).to.eql('Error: message');
    expect(typeof error.stack).to.eql('string');
  });

  it('should contain the original stack trace', () => {
    const error = fullCycle(produceError());
    expect(error.stack).to.contain('produceError');
  });

  it('should not contain the original stack trace', () => {
    const error = fullCycle(produceError(), { stack: false });
    expect(error.stack).to.not.contain('produceError');
  });

  it('should serialize objects', () => {
    const data = {
      a: 1,
      b: 'str',
      c: { d: 2, e: 'str', f: [{ g: 3 }, { e: null }] },
    };
    expect(fullCycle(data)).to.eql(data);
  });

  it('should serialize objects that deeply contain an error', () => {
    const { error } = fullCycle({ error: new Error('message') });
    expect(error).to.be.instanceof(Error);
  });

  it('should serialize objects that deeply contain a date', () => {
    const utc = Date.UTC(1981, 12, 27, 1, 2, 3, 4);
    const { date } = fullCycle({ date: new Date(utc) });
    expect(date).to.be.instanceof(Date);
    expect(date.getTime()).to.eql(utc);
  });
});
