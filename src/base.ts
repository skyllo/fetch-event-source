/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */

// ready state
const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 2;

export interface FetchEventSourceConfiguration {
  /** custom fetch implementation */
  fetch?: typeof fetch;
  /** custom headers to add to SSE request */
  headers?: Headers;
  /** automatically starts the SSE request */
  autoStart?: boolean;
  /** send cookies to cross-origin URLs */
  withCredentials?: boolean;
  /** initial reconnection delay */
  reconnectionDelay?: number;
}

export default abstract class BaseFetchEventSource extends EventTarget {
  public url: string;

  public withCredentials: boolean;

  public readyState: number = CONNECTING;

  public onopen: () => void | undefined;

  public onmessage: (e?: MessageEvent) => void | undefined;

  public onerror: (error?: ErrorEvent) => void | undefined;

  protected abstract _fetch: typeof fetch | any;

  protected abstract _decode: (bytes) => string;

  protected abstract _getOrigin: () => string;

  protected _transformStream = (stream) => stream;

  #controller: AbortController = new AbortController();

  #config: FetchEventSourceConfiguration = {
    headers: new Headers(),
    autoStart: true,
    reconnectionDelay: 2000,
    withCredentials: false,
  };

  #lastId = '';

  constructor(url: string, config?: FetchEventSourceConfiguration) {
    super();
    // check url is set
    if (!url) {
      throw new Error('Cannot open an FetchgEventSource to an empty URL.');
    }
    this.url = url;
    this.#config = { ...this.#config, ...config };
    this.withCredentials = this.#config.withCredentials;
    // if autoStart set then start connection
    if (this.#config.autoStart) {
      // start on nextTick so everything is initialized
      setTimeout(this.start.bind(this), 0);
    }
  }

  public async start() {
    try {
      await this._connect();
    } catch (e) {
      // start new connection if user did not abort
      if (!this.#controller.signal.aborted) {
        this._error(e);
        await new Promise((resolve) => setTimeout(resolve, this.#config.reconnectionDelay));
        this.start();
      }
    }
  }

  private async _connect() {
    this.#controller = new AbortController();
    // setup fetch and headers
    const { fetch = this._fetch, headers } = this.#config;
    headers.set('Accept', 'text/event-stream');
    if (this.#lastId) {
      headers.set('Last-Event-ID', this.#lastId);
    }
    // connecting
    this.readyState = CONNECTING;
    // make fetch request to SSE
    const response = await fetch(this.url, {
      signal: this.#controller.signal,
      headers,
      credentials: this.#config.withCredentials ? 'include' : 'same-origin',
      cache: 'no-store',
    });
    // fail if not 200 response
    if (!response || response.status !== 200) {
      this.close();
      this._error(new Error('Bad status'));
      return;
    }
    // check is correct content-type from response
    const type = response.headers.get('content-type');
    if (!type || type.split(';')[0] !== 'text/event-stream') {
      this.close();
      this._error(new Error('Bad content-type'));
      return;
    }
    // connected
    this.readyState = OPEN;
    this.dispatchEvent(new Event('open'));
    if (this.onopen) this.onopen();
    // transform stream and process reader
    const reader = this._transformStream(response.body).getReader();
    await this._process(reader);
  }

  private async _process(reader) {
    let type: string = '';
    let data: string[] = [];
    let buffer: string = '';
    for (;;) {
      // stop if has been aborted
      if (this.#controller.signal.aborted) {
        reader.cancel();
        return;
      }
      // check if buffer contains CRLF, LF or CR
      const regex = /\r\n|\r|\n/.exec(buffer);
      if (regex) {
        // get next line which can be a new line
        const line = buffer.slice(0, regex.index) || regex[0];
        buffer = buffer.slice(regex.index + regex[0].length);
        const [key, value = ''] = line.split(/:(.+)?/, 2).map((v2) => v2?.trimLeft());
        // send event if line is a new line
        if (line.match(/^(\r\n|\r|\n)$/) && (type || data)) {
          // create event
          const event = new MessageEvent(type, {
            origin: this._getOrigin(),
            data: data.join('\n'),
            lastEventId: this.#lastId,
          });
          // dispatch event
          this.dispatchEvent(event);
          if (type === 'message' && this.onmessage) this.onmessage(event);
          // reset event data
          type = '';
          data = [];
        }
        // process line
        switch (key) {
          case 'event': {
            type = value;
            break;
          }
          case 'data': {
            type = type || 'message';
            data.push(value);
            break;
          }
          case 'id': {
            this.#lastId = value;
            break;
          }
          case 'retry': {
            const num = Number(value);
            if (num) this.#config.reconnectionDelay = num;
            break;
          }
          default: break;
        }
      } else {
        // read next data
        const { value: byteValue, done } = await reader.read();
        if (done) throw Error('Connection terminated');
        // decode value for both browsers and node
        const value = (typeof byteValue === 'string') ? byteValue : this._decode(byteValue);
        buffer += value;
      }
    }
  }

  close() {
    this.readyState = CLOSED;
    this.#controller.abort();
  }

  _error(error) {
    const event = new ErrorEvent('error', { error, message: error.message });
    this.dispatchEvent(event);
    if (this.onerror) this.onerror(event);
  }
}
