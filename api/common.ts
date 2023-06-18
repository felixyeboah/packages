import _ from 'lodash';

import type { CreateApiRequestOptions } from './createApiRequest';

/**
 * Merges createApiRequest options, which can be nested objects, hence using lodash's merge
 */
export function mergeCreateApiRequestOptions(
  definitionCreateApiRequestOptions?: CreateApiRequestOptions,
  usageCreateApiRequestOptions?: Partial<CreateApiRequestOptions>,
) {
  return _.merge({}, definitionCreateApiRequestOptions, usageCreateApiRequestOptions);
}

/**
 * You can use keyOptions.id / keyOptions.props / keyOptions.queryParams to generate key
 * Availability of those is based on how the query / mutation was build
 */
export type KeyFn = (keyOptions: {
  id?: string | number | Record<PropertyKey, unknown>;
  queryParams?: Record<PropertyKey, unknown>;
  props?: Record<PropertyKey, unknown>;
}) => string | Array<string | Record<PropertyKey, unknown>>;

export const defaultErrorMessage = 'Something went wrong, please try again';
