import { QueryObserverOptions } from 'react-query/types/core/types';

import { KeyFn } from './common';
import { CreateApiRequestOptions } from './createApiRequest';

export interface QueryConfig extends QueryObserverOptions {
  /**
   * Can query be executed?
   */
  enabled?: boolean;

  /**
   * If set, any previous data will be kept when fetching new data because the query key changed.
   */
  keepPreviousData?: boolean;

  /**
   * Should query retry on error response?
   */
  retry?: boolean;

  /**
   * Callbacks
   */
  staleTime?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (err: unknown) => void;
  onSettled?: (data: unknown, error: unknown) => void;
}

export type BuildQueryOptions = {
  key: KeyFn | string;

  /**
   * You can pass defaults for query how to construct the API request, these usually are `url` and `method`
   */
  api: CreateApiRequestOptions;

  /**
   * You can pass defaults for actual query behaviour
   */
  query?: QueryConfig;

  /**
   * API url from which to fetch data: comes from the environment or from the `api` config
   */
  baseUrl?: CreateApiRequestOptions['baseUrl'];
};
