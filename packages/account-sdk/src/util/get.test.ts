import { get } from './get.js';

describe('get', () => {
  it('should return the value from the path', () => {
    const obj = { a: { b: { c: 'd' } } };
    expect(get(obj, 'a.b.c')).toBe('d');
  });

  it('should return undefined if the path is not found', () => {
    const obj = { a: { b: { c: 'd' } } };
    expect(get(obj, 'a.b.c.d')).toBeUndefined();
  });
  
  it('should return undefined for empty paths', () => {
  const obj = { a: { b: { c: 'd' } } };

  expect(get(obj, '')).toBeUndefined();
  expect(get(obj, '   ')).toBeUndefined();
  });
});
