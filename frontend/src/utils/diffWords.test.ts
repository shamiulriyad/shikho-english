import { describe, expect, test } from 'vitest';
import { diffWords } from './diffWords';

describe('diffWords', () => {
  test('marks a replaced article', () => {
    expect(diffWords('She is a honest girl.', 'She is an honest girl.')).toEqual([
      { type: 'same', text: 'She is ' },
      { type: 'removed', text: 'a ' },
      { type: 'added', text: 'an ' },
      { type: 'same', text: 'honest girl.' }
    ]);
  });

  test('marks an inserted article', () => {
    expect(diffWords('Sun rises in east.', 'The sun rises in the east.')).toEqual([
      { type: 'removed', text: 'Sun ' },
      { type: 'added', text: 'The sun ' },
      { type: 'same', text: 'rises in ' },
      { type: 'added', text: 'the ' },
      { type: 'same', text: 'east.' }
    ]);
  });

  test('an unchanged sentence is one part', () => {
    expect(diffWords('It is an apple.', 'It is an apple.')).toEqual([{ type: 'same', text: 'It is an apple.' }]);
  });

  test('copes with empty input', () => {
    expect(diffWords('', 'An apple.')).toEqual([{ type: 'added', text: 'An apple.' }]);
    expect(diffWords('', '')).toEqual([]);
  });
});
