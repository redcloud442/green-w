import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'movider/1.0 (api/6.1.2)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Send SMS message
   *
   * @summary Send SMS
   * @throws FetchError<400, types.PostSmsResponse400> Bad Request error response
   * @throws FetchError<401, types.PostSmsResponse401> The request did not receive an authenticated respose
   * @throws FetchError<500, types.PostSmsResponse500> System failure
   */
  postSms(body: types.PostSmsFormDataParam): Promise<FetchResponse<200, types.PostSmsResponse200>> {
    return this.core.fetch('/sms', 'post', body);
  }

  /**
   * Send SMS message
   *
   * @summary Send SMS
   * @throws FetchError<400, types.GetSmsResponse400> Bad Request error response
   * @throws FetchError<401, types.GetSmsResponse401> The request did not receive an authenticated respose
   * @throws FetchError<500, types.GetSmsResponse500> System failure
   */
  getSms(metadata: types.GetSmsMetadataParam): Promise<FetchResponse<200, types.GetSmsResponse200>> {
    return this.core.fetch('/sms', 'get', metadata);
  }

  /**
   * Message scheduling functionality gives you the ability to schedule an SMS for a fixed
   * time in the future.
   *
   * @summary Send SMS schedule messages.
   * @throws FetchError<400, types.PostSmsScheduledResponse400> Bad Request error response
   * @throws FetchError<401, types.PostSmsScheduledResponse401> The request did not receive an authenticated respose
   * @throws FetchError<500, types.PostSmsScheduledResponse500> System failure
   */
  postSmsScheduled(body: types.PostSmsScheduledFormDataParam): Promise<FetchResponse<200, types.PostSmsScheduledResponse200>> {
    return this.core.fetch('/sms/scheduled', 'post', body);
  }

  /**
   * You can also list all scheduled SMS messages. Click 'Try it' then input your **api-key
   * as username and api-secret as password.**
   *
   * @summary List all scheduled SMS messages.
   * @throws FetchError<401, types.GetSmsScheduledResponse401> The request did not receive an authenticated respose
   * @throws FetchError<500, types.GetSmsScheduledResponse500> System failure
   */
  getSmsScheduled(metadata: types.GetSmsScheduledMetadataParam): Promise<FetchResponse<200, types.GetSmsScheduledResponse200>> {
    return this.core.fetch('/sms/scheduled', 'get', metadata);
  }

  /**
   * Get a detail of schedule SMS message. Click 'Try it' then input your **api-key as
   * username and api-secret as password.**
   *
   * @summary Get a scheduled SMS message.
   * @throws FetchError<404, types.GetSmsScheduledScheduleidResponse404> Content not found
   * @throws FetchError<500, types.GetSmsScheduledScheduleidResponse500> System failure
   */
  getSmsScheduledScheduleid(metadata: types.GetSmsScheduledScheduleidMetadataParam): Promise<FetchResponse<200, types.GetSmsScheduledScheduleidResponse200>> {
    return this.core.fetch('/sms/scheduled/{scheduleId}', 'get', metadata);
  }

  /**
   * Cancel a scheduled SMS message before sending. Click 'Try it' then input your **api-key
   * as username and api-secret as password.**
   *
   * @summary Cancel a scheduled SMS message.
   * @throws FetchError<404, types.DeleteSmsScheduledScheduleidResponse404> Content not found
   * @throws FetchError<500, types.DeleteSmsScheduledScheduleidResponse500> System failure
   */
  deleteSmsScheduledScheduleid(metadata: types.DeleteSmsScheduledScheduleidMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms/scheduled/{scheduleId}', 'delete', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { DeleteSmsScheduledScheduleidMetadataParam, DeleteSmsScheduledScheduleidResponse404, DeleteSmsScheduledScheduleidResponse500, GetSmsMetadataParam, GetSmsResponse200, GetSmsResponse400, GetSmsResponse401, GetSmsResponse500, GetSmsScheduledMetadataParam, GetSmsScheduledResponse200, GetSmsScheduledResponse401, GetSmsScheduledResponse500, GetSmsScheduledScheduleidMetadataParam, GetSmsScheduledScheduleidResponse200, GetSmsScheduledScheduleidResponse404, GetSmsScheduledScheduleidResponse500, PostSmsFormDataParam, PostSmsResponse200, PostSmsResponse400, PostSmsResponse401, PostSmsResponse500, PostSmsScheduledFormDataParam, PostSmsScheduledResponse200, PostSmsScheduledResponse400, PostSmsScheduledResponse401, PostSmsScheduledResponse500 } from './types';
