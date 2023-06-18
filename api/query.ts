/* eslint-disable */
import { useQuery, UseQueryResult } from 'react-query';
import createApiRequest from './createApiRequest';
import { mergeCreateApiRequestOptions } from './common';
import { CreateQueryArgs, processArgs } from './misc';

import { BuildQueryOptions, QueryConfig } from './types';

// https://react-query.tanstack.com/reference/useQuery
// as time goes we can add other options here

export const defaultQueryConfig: QueryConfig = {
  retry: false,
  enabled: true,
};

/**
 * Merges query configs and makes sure callback are called as specified on each level
 */
function mergeQueryConfigs(
  definitionQueryConfig?: QueryConfig,
  usageQueryConfig?: QueryConfig,
): QueryConfig {
  const mergedQueryConfig = {
    ...defaultQueryConfig,
    ...definitionQueryConfig,
    ...usageQueryConfig,
  };

  // Merge onError callback so later specified ones won't overwrite sooned defined ones
  mergedQueryConfig.onError = (e) => {
    defaultQueryConfig.onError?.(e);
    definitionQueryConfig?.onError?.(e);
    usageQueryConfig?.onError?.(e);
  };

  // Merge onSettled callback so later specified ones won't overwrite sooned defined ones
  mergedQueryConfig.onSettled = (data, e) => {
    defaultQueryConfig.onSettled?.(data, e);
    definitionQueryConfig?.onSettled?.(data, e);
    usageQueryConfig?.onSettled?.(data, e);
  };

  // Merge onSuccess callback so later specified ones won't overwrite sooner defined ones
  mergedQueryConfig.onSuccess = (data) => {
    defaultQueryConfig.onSuccess?.(data);
    definitionQueryConfig?.onSuccess?.(data);
    usageQueryConfig?.onSuccess?.(data);
  };

  return mergedQueryConfig;
}

/** ************************************************************************************************
 * Main fn of the file
 ************************************************************************************************* */
export function fetchQuery<T>(
  buildOptions: BuildQueryOptions,
): (...fnArgs: CreateQueryArgs) => UseQueryResult<T, unknown> {
  const {
    key,
    api: definitionCreateApiRequestOptions,
    query: definitionQueryConfig,
  } = buildOptions;

  /*
   * CONSTRUCTING THE QUERY FN
   *
   * This created fn has dynamic signature of at most 3 arguments, two of which can be QueryConfig and CreateApiRequestOptions.
   * The extra parameter can be used to specify more details for the keyFn - it can be an actual id (string, number) but also an Object itself!
   *
   * Examples of valid usages:
   *
   * useQueryFn(3)
   * useQueryFn(3, { onSuccess: ... })
   * useQueryFn(3, { queryParams: { ... } })
   * useQueryFn(3, { onSuccess: ... }, { queryParams: { ... } })
   * useQueryFn(3, { queryParams: { ... } }, { onSuccess: ... })
   */
  const useQueryFn = (...fnArgs: CreateQueryArgs): UseQueryResult<unknown, unknown> => {
    // PARSE ARGS
    const { id, usageQueryConfig, usageCreateApiRequestOptions } = processArgs(fnArgs);

    // MERGE QUERY CONFIG
    const mergedQueryConfig = mergeQueryConfigs(definitionQueryConfig, usageQueryConfig);

    // MERGE API REQ OPTIONS
    const mergedCreateApiRequestOptions = mergeCreateApiRequestOptions(
      definitionCreateApiRequestOptions,
      usageCreateApiRequestOptions,
    );

    const queryKey =
      typeof key === 'string'
        ? key
        : key({
            // Making both `id` and `queryParams` available to key fn
            id,
            queryParams:
              (mergedCreateApiRequestOptions.queryParams as Record<
                PropertyKey,
                unknown
              >) ?? undefined,
          });

    // For queries (as opposite to mutations), the fn created by `createApiRequest` is called immediately
    // when a query is called in code - you don't get the destruct array as [mutation, response] so in order
    // to be able to pass the `id` to function created by `createApiRequest` we need to bind it below
    const apiRequest = createApiRequest(mergedCreateApiRequestOptions);

    // @ts-ignore
    return useQuery(queryKey, apiRequest.bind(null, { id }), mergedQueryConfig);
  };

  // @ts-ignore
  return useQueryFn;
}
