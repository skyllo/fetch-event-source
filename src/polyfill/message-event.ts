import Event from './event';

export default class MessageEvent extends Event {
  lastEventId: string;

  origin: string;

  data: any;

  constructor(type: any, { origin, data, lastEventId }) {
    super(type);
    this.lastEventId = lastEventId;
    this.origin = origin;
    this.data = data;
  }
}
