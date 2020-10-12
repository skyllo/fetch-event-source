/* eslint-disable import/first */
jest.mock('node-fetch');

import { PassThrough } from 'stream';
import fetch from 'node-fetch';
import '../src/polyfill';
import FetchEventSource from '../src/server';

const { Headers, Response } = jest.requireActual('node-fetch');
global.Headers = Headers;

// create a SSE
function createEvent(eventName, data, id = Date.now()) {
  return `id: ${id}\nevent: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
}

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// mock response to return SSE
function setupMockedResponse(eventString: string) {
  // mock events
  const mockedStream = new PassThrough();
  mockedStream.push(eventString);
  mockedStream.end();
  // mock response
  const response = new Response(mockedStream, { headers: { 'content-type': 'text/event-stream' } });
  mockedFetch.mockReturnValue(Promise.resolve(response));
}

beforeEach(() => {
  mockedFetch.mockClear();
});

it('should correctly trigger events when data is split', async (done) => {
  // mock events
  const NUM_EVENTS = 5;
  const mockedStream = new PassThrough();
  const data = Array(NUM_EVENTS)
    .fill('')
    .map((_, index) => createEvent('eventName', `secrets${index}`, index))
    .join('')
    .match(/(.|[\r\n]){1,4}/g);
  data.forEach((split) => mockedStream.push(split));
  mockedStream.end();
  // mock response
  const response = new Response(mockedStream, { headers: { 'content-type': 'text/event-stream' } });
  mockedFetch.mockReturnValue(Promise.resolve(response));
  // start fetcheventsource
  const eventSource = new FetchEventSource('https://lol.com');
  const events = [];
  eventSource.addEventListener('eventName', (e) => {
    events.push(e);
    if (events.length === NUM_EVENTS) {
      eventSource.close();
      expect(events).toMatchSnapshot();
      done();
    }
  });
});

it('should handle multiple data fields in one event (SPEC Example 1)', async (done) => {
  setupMockedResponse(`
data: YHOO
data: +2
data: 10

`);
  // start fetcheventsource
  const eventSource = new FetchEventSource('https://lol.com');
  eventSource.addEventListener('message', (e) => {
    eventSource.close();
    expect(e).toMatchSnapshot();
    done();
  });
});

it('should handle comment fields, spaces and empty ID values (SPEC Example 2)', async (done) => {
  setupMockedResponse(`
: test stream

data: first event
id: 1

data:second event
id:

data:  third event

`);
  // start fetcheventsource
  const eventSource = new FetchEventSource('https://lol.com');
  const events = [];
  eventSource.addEventListener('message', (e) => {
    events.push(e);
    if (events.length === 3) {
      eventSource.close();
      expect(events).toMatchSnapshot();
      done();
    }
  });
});

it('should only send events after new lines and double empty data should fire event with a new line (SPEC Example 3)', async (done) => {
  setupMockedResponse(`
data

data
data

data:
`);
  // start fetcheventsource
  const eventSource = new FetchEventSource('https://lol.com');
  const events = [];
  eventSource.addEventListener('message', (e) => {
    events.push(e);
    if (events.length === 2) {
      eventSource.close();
      expect(events).toMatchSnapshot();
      done();
    }
  });
});

it('should send ignore white space after colon to produce same event (SPEC Example 4)', async (done) => {
  setupMockedResponse('data:test\n\ndata: test\n\n');
  // start fetcheventsource
  const eventSource = new FetchEventSource('https://lol.com');
  const events = [];
  eventSource.addEventListener('message', (e) => {
    events.push(e);
    if (events.length === 2) {
      eventSource.close();
      expect(events).toMatchSnapshot();
      done();
    }
  });
});
