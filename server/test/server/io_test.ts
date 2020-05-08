import 'mocha';
import { expect } from 'chai';

const hello = (): string => 'Hello world!';

describe('Hello function', () => {

  it('should return hello world', () => {
    const result = hello();
    expect(result).to.equal('Hello world!');
  });

});
