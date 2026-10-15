import { describe, expect, test } from 'vitest';
import { parseDemoVideo } from './demoVideo';

describe('parseDemoVideo', () => {
  test.each([
    ['https://www.youtube.com/watch?v=abcdefghijk', 'abcdefghijk'],
    ['https://youtu.be/abcdefghijk', 'abcdefghijk'],
    ['https://m.youtube.com/watch?v=abcdefghijk&t=10', 'abcdefghijk'],
    ['https://www.youtube.com/embed/abcdefghijk', 'abcdefghijk'],
    ['https://www.youtube.com/shorts/abcdefghijk', 'abcdefghijk']
  ])('embeds %s through youtube-nocookie', (raw, id) => {
    expect(parseDemoVideo(raw)).toEqual({ kind: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${id}` });
  });

  test('plays an https video file directly', () => {
    expect(parseDemoVideo(' https://cdn.example.org/demo.MP4 ')).toEqual({ kind: 'file', src: 'https://cdn.example.org/demo.MP4' });
  });

  test.each([
    undefined,
    '',
    '   ',
    'not a url',
    'http://www.youtube.com/watch?v=abcdefghijk',
    'javascript:alert(1)',
    'https://www.youtube.com/watch?v=short',
    'https://evil.example/watch?v=abcdefghijk',
    'https://example.org/page.html'
  ])('treats %j as not configured', (raw) => {
    expect(parseDemoVideo(raw)).toBeNull();
  });
});
