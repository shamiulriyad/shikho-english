import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';
import DemoVideo from '../components/home/DemoVideo';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { Topic } from '../types/api';

const TOPICS: Topic[] = [
  { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  { code: 'narration', nameEn: 'Narration (Direct and Indirect Speech)', nameBn: 'উক্তি পরিবর্তন' },
  { code: 'other', nameEn: 'Other', nameBn: 'অন্যান্য' }
];

const renderHome = (topics: () => Response = () => jsonResponse(TOPICS)) => {
  const fetchMock = mockApi({ 'GET /topics': topics });
  renderWithProviders(<HomePage />);
  return fetchMock;
};

describe('Hero', () => {
  test('a visitor starts by registering, or explores the demo on the page', () => {
    renderHome();

    const hero = within(screen.getByRole('region', { name: 'English, finally making sense.' }));
    expect(hero.getByRole('link', { name: 'Start Learning' })).toHaveAttribute('href', '/register');
    expect(hero.getByRole('link', { name: 'Explore the Experience' })).toHaveAttribute('href', '/#clarity');
  });

  test('a signed-in student starts learning straight away', () => {
    signIn();
    renderHome();

    const hero = within(screen.getByRole('region', { name: 'English, finally making sense.' }));
    expect(hero.getByRole('link', { name: 'Start Learning' })).toHaveAttribute('href', '/analyze');
  });
});

describe('Sentence Studio', () => {
  test('is labelled as an example and opens on the first note', () => {
    renderHome();

    expect(screen.getByText('An illustrative example written for this page, not a live AI result.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /has been reading/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Present perfect continuous')).toBeInTheDocument();
  });

  test('choosing a phrase by mouse or keyboard explains it in English and Bangla', async () => {
    renderHome();

    await userEvent.click(screen.getByRole('button', { name: /^an, grammar note 2/ }));
    expect(screen.getByText('An before a vowel sound')).toBeInTheDocument();
    expect(screen.getByText('English শব্দটি স্বরধ্বনি দিয়ে শুরু, তাই এর আগে an বসে।')).toHaveAttribute('lang', 'bn');

    // Keyboard: moving focus onto a phrase chooses it
    screen.getByRole('button', { name: /since/ }).focus();
    expect(await screen.findByText('Since marks a starting point')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /since/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('From confusion to clarity', () => {
  test('walks from the faulty sentence to the corrected one', async () => {
    renderHome();
    const demo = within(screen.getByRole('region', { name: 'From confusion to clarity.' }));

    expect(demo.getByText('Read the sentence. Does anything sound wrong?')).toBeInTheDocument();
    expect(demo.getByRole('button', { name: 'Back' })).toBeDisabled();

    await userEvent.click(demo.getByRole('button', { name: 'Next: Spot' }));
    expect(demo.getByText('(mistake 1)', { exact: false })).toBeInTheDocument();

    await userEvent.click(demo.getByRole('button', { name: 'Next: Understand' }));
    expect(demo.getByText('Honest begins with a vowel sound (the h is silent), so it takes an.')).toBeInTheDocument();
    expect(demo.getByText('who এখানে একজন man-কে বোঝায়, তাই present simple-এ ক্রিয়ার সাথে -s যোগ হয়।')).toBeInTheDocument();

    await userEvent.click(demo.getByRole('button', { name: 'Next: Clarity' }));
    const added = [...document.querySelectorAll('#clarity ins')].map((el) => el.textContent);
    expect(added).toEqual(['added: an', 'added: tells']);
    expect(demo.getByRole('link', { name: 'Try it with your own question' })).toHaveAttribute('href', '/register');
  });

  test('any step can be opened directly', async () => {
    renderHome();
    const demo = within(screen.getByRole('region', { name: 'From confusion to clarity.' }));

    await userEvent.click(demo.getByRole('button', { name: /Understand/ }));

    expect(demo.getByRole('button', { name: /Understand/ })).toHaveAttribute('aria-current', 'step');
    expect(demo.getByText('Here is why each one is wrong.')).toBeInTheDocument();
  });
});

describe('Topic index', () => {
  test('lists the real topics, leaving out the catch-all, and sends visitors through login', async () => {
    renderHome();
    const section = within(screen.getByRole('region', { name: 'Find your next step.' }));

    const articles = await section.findByRole('link', { name: /Articles/ });
    expect(articles).toHaveAttribute('href', '/login?next=%2Fanalyze%3Ftopic%3Darticles');
    expect(section.getByText('উক্তি পরিবর্তন')).toHaveAttribute('lang', 'bn');
    expect(section.queryByText('Other')).not.toBeInTheDocument();
  });

  test('a signed-in student opens Analyze with the topic chosen', async () => {
    signIn();
    renderHome();
    const section = within(screen.getByRole('region', { name: 'Find your next step.' }));

    expect(await section.findByRole('link', { name: /Articles/ })).toHaveAttribute('href', '/analyze?topic=articles');
  });

  test('a failed load can be retried', async () => {
    let calls = 0;
    renderHome(() => (++calls === 1 ? problemResponse(503, 'Database unavailable') : jsonResponse(TOPICS)));
    const section = within(screen.getByRole('region', { name: 'Find your next step.' }));

    await userEvent.click(await section.findByRole('button', { name: 'Try again' }));

    expect(await section.findByRole('link', { name: /Articles/ })).toBeInTheDocument();
  });
});

describe('Product preview', () => {
  test('without a video it shows the real explanation screen and says the video is coming', () => {
    renderHome();
    const section = within(screen.getByRole('region', { name: 'See the real screen.' }));

    expect(section.getByText('Video walkthrough: coming soon')).toBeInTheDocument();
    expect(section.getByRole('article')).toHaveTextContent('Use an before a vowel sound.');
  });

  test('a YouTube walkthrough loads only after pressing play', async () => {
    render(<DemoVideo video={{ kind: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/abcdefghijk' }} />);

    expect(screen.queryByTitle('Shikho English walkthrough')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Play the walkthrough/ }));

    expect(screen.getByTitle('Shikho English walkthrough')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1'
    );
  });

  test('a video file plays in the native player', () => {
    render(<DemoVideo video={{ kind: 'file', src: 'https://cdn.example.org/demo.mp4' }} />);

    expect(screen.getByTitle('Shikho English walkthrough')).toHaveAttribute('controls');
  });
});

describe('Story sections', () => {
  test('patterns, anatomy, the workflow and the closing all link to real pages', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'English has a pattern.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'See what makes a sentence work.' })).toBeInTheDocument();

    const journey = within(screen.getByRole('region', { name: 'Practice with purpose.' }));
    expect(journey.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/analyze',
      '/practice',
      '/quiz',
      '/history',
      '/progress'
    ]);

    const closing = within(screen.getByRole('region', { name: 'Every sentence can make sense.' }));
    expect(closing.getByRole('link', { name: 'Start Learning' })).toHaveAttribute('href', '/register');
    expect(closing.getByRole('link', { name: 'Browse topics' })).toHaveAttribute('href', '/topics');
  });

  test('answers common questions honestly', async () => {
    renderHome();

    await userEvent.click(screen.getByText('Are the answers always correct?'));

    expect(screen.getByText(/Explanations are written by AI and can contain mistakes/)).toBeVisible();
  });
});
