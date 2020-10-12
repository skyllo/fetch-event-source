import Event from './event';

export default class ErrorEvent extends Event {
  message: any;

  error: any;

  constructor(type: any, { message, error }) {
    super(type);
    this.message = message;
    this.error = error;
  }
}
