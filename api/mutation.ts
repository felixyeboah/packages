import _ from 'lodash';
import {
  MutateFunction,
  MutateOptions,
  MutationObserverResult,
  useMutation,
  useQueryClient,
} from 'react-query';

import type { KeyFn } from './common';
import { mergeCreateApiRequestOptions } from './common';
import type { CreateApiRequestOptions } from './createApiRequest';
import createApiRequest from './createApiRequest';

export type MutationConfig = {
  onMutate?: (...args: any) => any;
  onSuccess?: (...args: any) => any;
  onError?: (...args: any) => any;
  onSettled?: (...args: any) => any;
  props?: Record<string, any>;
  throwOnError?: boolean;
};

export const defaultMutationConfig: MutationConfig = {
  onMutate: _.noop,
  onSuccess: _.noop,
  onError: _.noop,
  onSettled: _.noop,
  props: {},
  throwOnError: false,
};

/**
 * Merges mutation configs and makes sure callback are called as specified on each level
 */
function mergeMutationConfigs(
  definitionMutationConfig: MutationConfig = {},
  usageMutationConfig: MutationConfig = {},
) {
  const mergedMutationConfig = {
    ...defaultMutationConfig,
    ...definitionMutationConfig,
    ...usageMutationConfig,
  };

  // Merge onMutate callback so later specified ones won't overwrite sooned defined ones
  mergedMutationConfig.onMutate = (vars) => {
    defaultMutationConfig.onMutate && defaultMutationConfig.onMutate(vars);
    // prettier-ignore
    definitionMutationConfig.onMutate && definitionMutationConfig.onMutate(vars);
    usageMutationConfig.onMutate && usageMutationConfig.onMutate(vars);
  };

  // Merge onError callback so later specified ones won't overwrite sooned defined ones
  mergedMutationConfig.onError = (e, vars, onMutateValue) => {
    // prettier-ignore
    defaultMutationConfig.onError && defaultMutationConfig.onError(e, vars, onMutateValue);
    // prettier-ignore
    definitionMutationConfig.onError && definitionMutationConfig.onError(e, vars, onMutateValue);
    // prettier-ignore
    usageMutationConfig.onError && usageMutationConfig.onError(e, vars, onMutateValue);
  };

  // Merge onSettled callback so later specified ones won't overwrite sooned defined ones
  mergedMutationConfig.onSettled = (data, e, vars, onMutateValue) => {
    // prettier-ignore
    defaultMutationConfig.onSettled && defaultMutationConfig.onSettled(data, e, vars, onMutateValue);
    // prettier-ignore
    definitionMutationConfig.onSettled && definitionMutationConfig.onSettled(data, e, vars, onMutateValue);
    // prettier-ignore
    usageMutationConfig.onSettled && usageMutationConfig.onSettled(data, e, vars, onMutateValue);
  };

  // Merge onSuccess callback so later specified ones won't overwrite sooned defined ones
  mergedMutationConfig.onSuccess = (data, vars) => {
    // prettier-ignore
    defaultMutationConfig.onSuccess && defaultMutationConfig.onSuccess(data, vars);
    // prettier-ignore
    definitionMutationConfig.onSuccess && definitionMutationConfig.onSuccess(data, vars);
    usageMutationConfig.onSuccess && usageMutationConfig.onSuccess(data, vars);
  };

  return mergedMutationConfig;
}

type BuildMutationOptions = {
  /**
   * Allows to augment what is passed to the `mutate` fn before calling it.
   *
   * Available args are:
   * - params: whatever was passed to `mutate` fn in the 1st place
   * - props: props are injected into the `params` as `$props`
   */
  augmentMutationParams?: (params: Record<string, unknown>) => any;

  /**
   * Keys specified here are automatically refetched in onSuccess callback
   */
  keysToRefetch?: Array<KeyFn | string>;

  /**
   * You can pass defaults for mutation how to construct the API request, these usually are `url`, `method`, `content` and `authenticate`
   */
  api: CreateApiRequestOptions;

  /**
   * You can pass defaults for actual mutation behaviour
   */
  mutation?: MutationConfig;
};

type BuildGeneralMutationResponse = (
  usageMutationConfig?: MutationConfig,
  // @ts-ignore
  usageCreateApiRequestOptions?: CreateApiRequestOptions,
) => [MutateFunction, MutationObserverResult];

/** ************************************************************************************************
 * Main fn of the file
 ************************************************************************************************* */
export function createMutation(
  buildOptions: BuildMutationOptions,
): BuildGeneralMutationResponse {
  const {
    augmentMutationParams = _.identity,
    keysToRefetch,
    api: definitionCreateApiRequestOptions,
    mutation: definitionMutationConfig = {},
  } = buildOptions;

  /*
   * CONSTRUCTING THE MUTATION FN
   */
  const useMutationFn = (
    usageMutationConfig?: MutationConfig,
    // @ts-ignore
    usageCreateApiRequestOptions?: CreateApiRequestOptions = {},
  ) => {
    const queryClient = useQueryClient();

    // MERGE MUTATION CONFIG
    const mergedMutationConfig = mergeMutationConfigs(
      definitionMutationConfig,
      usageMutationConfig,
    );

    // MERGE API REQ OPTIONS
    const mergedCreateApiRequestOptions = mergeCreateApiRequestOptions(
      definitionCreateApiRequestOptions,
      usageCreateApiRequestOptions,
    );

    const mergedPayloadFn = mergedCreateApiRequestOptions.payload;
    mergedCreateApiRequestOptions.payload = (payload) => {
      const processedPayload = mergedPayloadFn ? mergedPayloadFn(payload) : payload;
      return _.omit(processedPayload, '$props');
    };

    // The most common case is to refetch queries after a successful mutation (which usually creates/edits/deletes smth) so that the screen shows
    // most updated info. For this, you can specify `keysToRefetch` in buildOptions and these keys will be automatically added to `onSuccess` so you don't to manually rememeber to
    // hijack onSuccess with query refetches and also call any potential original onSuccess passed
    if (keysToRefetch) {
      const mergedOnSuccess = mergedMutationConfig.onSuccess;
      // Augment merged `onSuccess` once more
      mergedMutationConfig.onSuccess = (...args) => {
        keysToRefetch.forEach((keyToRefetch) => {
          if (typeof keyToRefetch === 'string') {
            queryClient.invalidateQueries(keyToRefetch);
          } else {
            queryClient.invalidateQueries(
              keyToRefetch({
                // Provide expanded `props` & `queryParams` if they were specified
                // Expanding here, because key functions are used by queries as well and
                // writing key fns listen to both direct parameters and `props` as well would be too complicated
                ...(mergedMutationConfig.props ?? {}),
                // @ts-ignore
                queryParams: mergedCreateApiRequestOptions?.queryParams ?? undefined,
              }),
            );
          }
        });

        // Call the originally merged `onSuccess`

        // @ts-ignore
        mergedOnSuccess(...args);
      };
    }

    const { mutateAsync, ...rest } = useMutation(
      // @ts-ignore
      createApiRequest(mergedCreateApiRequestOptions),
      mergedMutationConfig,
    );

    function mutation(
      params: Record<string, unknown>,
      mutationConfig: MutateOptions<any, any, {} | undefined, any> | undefined,
    ) {
      const parameters = augmentMutationParams({
        ...(params ?? {}),
        $props: mergedMutationConfig.props ?? {},
      });

      return mutateAsync(parameters, mutationConfig);
    }

    return [mutation, rest];
  };

  // @ts-ignore
  return useMutationFn;
}
