import _ from 'lodash';

import { CreateApiRequestOptions } from './createApiRequest';
import { QueryConfig } from './types';

const queryConfigProps = [
  'url',
  'method',
  'content',
  'queryParams',
  'authenticate',
  'format',
  'payload',
  'params',
];

const apiRequestProps = [
  'cacheTime',
  'enabled',
  'initialData',
  'initialStale',
  'isDataEqual',
  'keepPreviousData',
  'notifyOnStatusChange',
  'onError',
  'onSettled',
  'onSuccess',
  'queryFnParamsFilter',
  'queryKeySerializerFn',
  'refetchInterval',
  'refetchIntervalInBackground',
  'refetchOnMount',
  'refetchOnReconnect',
  'refetchOnWindowFocus',
  'retry',
  'retryDelay',
  'staleTime',
  'structuralSharing',
  'suspense',
  'useErrorBoundary',
];

// Accepts 1-3 arguments, if 3 arguments - `id` must be first, otherwise order does not matter
// id: any,
// usageQueryConfig?: QueryConfig,
// usageCreateApiRequestOptions: CreateApiRequestOptions,

export type CreateQueryArgs =
  | []
  | [string | number | CreateApiRequestOptions | QueryConfig]
  | [string | number, CreateApiRequestOptions | QueryConfig];

/**
 * Detects single argument and its type
 */
function processArg(
  arg: string | number | CreateApiRequestOptions | QueryConfig,
):
  | { id: string | number | Record<PropertyKey, unknown> }
  | { usageCreateApiRequestOptions: CreateApiRequestOptions }
  | { usageQueryConfig: QueryConfig } {
  // If the arg is not an object, it can only be an `id`/`extra`
  if (!_.isPlainObject(arg))
    return {
      id: arg as string | number,
    };

  // These are options available to api request config, if some of them is present, the arg was meant as api request config
  if (queryConfigProps.some((key) => _.has(arg, key))) {
    return {
      usageCreateApiRequestOptions: arg as CreateApiRequestOptions,
    };
  }

  // These are options available to react query config, if some of them is present, the arg was meant as query config
  if (apiRequestProps.some((key) => _.has(arg, key))) {
    return {
      usageQueryConfig: arg as QueryConfig,
    };
  }

  // The argument is an object, but does not match any config, treat it as an `id` but of object type
  return {
    id: arg as Record<PropertyKey, unknown>,
  };
}

/**
 * Detects all args passed to useQueryFn
 */
export function processArgs(args: CreateQueryArgs): {
  id?: string | number | Record<PropertyKey, unknown>;
  usageCreateApiRequestOptions?: CreateApiRequestOptions;
  usageQueryConfig?: QueryConfig;
} {
  if (args.length === 0) return {};

  if (args.length === 1) {
    // Passed argument can be meant as either `usageQueryConfig` / `usageCreateApiRequestOptions` or some `id`/`extra`
    return processArg(args[0]);
  }

  if (args.length === 2) {
    // Used the full fn signature, mapping is straightforward
    // 1st param is `id` and allow for mixed order of query and api configs so deduce which one is which
    return {
      id: args[0],
      ...processArg(args[1]),
    };
  }

  throw new Error(
    `Tried to use more than 2 arguments with useQueryFn created by createQuery`,
  );
}
