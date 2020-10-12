import isAbsoluteURL from 'is-absolute-url';
import BaseFES from './base';

const decoder = new TextDecoder();

export default class FetchEventSource extends BaseFES {
  _fetch = window.fetch.bind(window);

  _decode = (bytes) => decoder.decode(bytes);

  _getOrigin = () => {
    if (isAbsoluteURL(this.url)) {
      return new URL(this.url).origin;
    }
    return window.location.origin;
  }
}