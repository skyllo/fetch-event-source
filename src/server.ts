import fetch from 'node-fetch';
import { ReadableStream } from 'web-streams-polyfill/ponyfill';
import { TextDecoder } from 'util';
import BaseFES from './base';

function readableStreamFromAsyncIterable(iterable) {
  const it = iterable[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await it.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel(reason) {
      await it.throw(reason);
    },
  }, { highWaterMark: 0 });
}

const decoder = new TextDecoder();

export default class FetchEventSource extends BaseFES {
  _fetch = fetch;

  _decode = (bytes) => decoder.decode(bytes);

  _getOrigin = () => new URL(this.url).origin;

  _transformStream = readableStreamFromAsyncIterable;
}
