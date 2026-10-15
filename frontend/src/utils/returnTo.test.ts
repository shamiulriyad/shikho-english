import { describe, expect, test } from 'vitest';
import { loginPath, safeReturnTo, withReturnTo } from './returnTo';

describe('safeReturnTo', () => {
  test.each([
    ['/analyze', '/analyze'],
    ['/history?page=2&topic=articles', '/history?page=2&topic=articles'],
    ['/questions/5#steps', '/questions/5#steps'],
    ['/practice-sets/../progress', '/progress']
  ])('accepts the in-app path %j', (raw, expected) => {
    expect(safeReturnTo(raw)).toBe(expected);
  });

  test.each([
    null,
    undefined,
    '',
    'analyze',
    'https://evil.example/',
    '//evil.example/path',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    '/history\nSet-Cookie: x',
    '/login',
    '/register?next=%2Fhistory'
  ])('rejects %j', (raw) => {
    expect(safeReturnTo(raw)).toBeNull();
  });
});

describe('loginPath', () => {
  test('remembers a safe destination', () => {
    expect(loginPath('/history?page=2')).toBe('/login?next=%2Fhistory%3Fpage%3D2');
  });

  test('drops unsafe, home and missing destinations', () => {
    expect(loginPath('//evil.example')).toBe('/login');
    expect(loginPath('/')).toBe('/login');
    expect(loginPath(null)).toBe('/login');
  });
});

test('withReturnTo carries the destination between login and register', () => {
  expect(withReturnTo('/register', '/progress')).toBe('/register?next=%2Fprogress');
  expect(withReturnTo('/register', null)).toBe('/register');
});
