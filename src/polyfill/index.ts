/* eslint-disable max-classes-per-file */
import EventTarget from 'event-target-shim';
import AbortController from 'abort-controller';
import { Headers } from 'node-fetch';
import Event from './event';
import ErrorEvent from './error-event';
import MessageEvent from './message-event';

global.AbortController = AbortController;
global.EventTarget = EventTarget;
// @ts-ignore
global.Headers = Headers;
// @ts-ignore
global.Event = Event;
// @ts-ignore
global.MessageEvent = MessageEvent;
// @ts-ignore
global.ErrorEvent = ErrorEvent;
