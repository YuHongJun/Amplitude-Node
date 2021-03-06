import * as https from 'https';
import { logger } from '@amplitude/utils';
import { Client, Event, Options } from '@amplitude/types';
import { SDK_NAME, SDK_VERSION, AMPLITUDE_API_HOST, AMPLITUDE_API_PATH } from './constants';

export class NodeClient implements Client<Options> {
  /** Project Api Key */
  protected readonly _apiKey: string;

  /** Options for the client. */
  protected readonly _options: Options;

  /**
   * Initializes this client instance.
   *
   * @param apiKey API key for your project
   * @param options options for the client
   */
  public constructor(apiKey: string, options: Options) {
    this._apiKey = apiKey;
    this._options = options;
    if (options.debug || options.logLevel) {
      logger.enable(options.logLevel);
    }
  }

  /**
   * @inheritDoc
   */
  getOptions(): Options {
    return this._options;
  }

  /**
   * @inheritDoc
   */
  flush(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * @inheritDoc
   */
  public logEvent(event: Event): void {
    if (this._options.optOut === true) {
      return;
    }

    this._annotateEvent(event);

    const payload = JSON.stringify({
      api_key: this._apiKey,
      events: [event],
    });

    const hostname = this._options.serverUrl || AMPLITUDE_API_HOST;
    const requestOptions = {
      hostname: hostname,
      path: AMPLITUDE_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(requestOptions, res => {
      res.on('data', _ => {
        // Request finishes.
        // We currently don't have error handling or retry, but we will add it soon.
      });
    });

    req.on('error', error => {
      console.info('[Amplitude|Error] Event is not submitted.', error);
    });

    req.write(payload);
    req.end();
  }

  /** Add platform dependent field onto event. */
  private _annotateEvent(event: Event): void {
    event.library = `${SDK_NAME}/${SDK_VERSION}`;
    event.platform = 'Node.js';
  }
}
