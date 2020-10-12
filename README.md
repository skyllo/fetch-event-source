# FetchEventSource

Fetch implementation of EventSource with more functionality such as HTTP headers and support for Node.js. Written in TypeScript with the types includes in the package.

# Features
* Lightweight! 4kb in size (2kb gzip)
* Tested on latest Safari, Firefox, Chrome on MacOS

# Installation
```bash
yarn add fetch-event-source
```

```bash
npm install --save fetch-event-source
```

# Usage
The API is the same as [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

```javascript
import FetchEventSource from 'fetch-event-source';

const eventSource = new FetchEventSource('/sse');
eventSource.addListener('open', () => console.log('SSE Open'));
eventSource.addListener('error', (err) => console.log('SSE Error', err));
eventSource.addListener('message', (e) => console.log('SSE Data', e.data));
```

## Node.js

You can import in node using either syntax.
```javascript
import FetchEventSource from 'fetch-event-source/server';
```
Or
```javascript
const FetchEventSource = require('fetch-event-source/server');
```

# API
## Constructor
`new FetchEventSource(Config)`

### Config
Typescript Config Definition

```typescript
interface FetchEventSourceConfiguration {
    /** set custom fetch implementation */
    fetch?: typeof fetch;
    /** set custom headers to add to SSE request */
    headers?: Headers;
    /** automatically starts the SSE request */
    autoStart?: boolean;
    /** send cookies to cross-origin URLs */
    withCredentials?: boolean;
    /** initial reconnection delay */
    reconnectionDelay?: number;
}
```

# Testing
All tests run using Jest in Node.js using this command.

```javascript
yarn test
```

# Similar Projects
* sse-client: https://github.com/julienmachon/sse-client
* sse-fetcher: https://github.com/jakearchibald/sse-fetcher

