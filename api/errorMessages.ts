// https://www.notion.so/primerapi/API-Errors-f65472c118f144aba3ffd64bd10d732c

export type ErrorId = 'BadRequest' | 'ServerError' | string;

export const errorType: Record<ErrorId, string> = {
  BadRequest: 'Bad request',
  ServerError: 'Server error',
};
