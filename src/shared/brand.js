/** Tokenz brand constants */
export const PRODUCT_NAME = 'Tokenz';
export const PRODUCT_TAGLINE = 'Documents into your AI chat';
export const EVENT_FILES = 'tokenz:files';
export const EVENT_READY = 'tokenz:ready';
export const EVENT_CLEANUP = 'tokenz:cleanup';

/** One message / one send part — split only above this. */
export const SEND_CHAR_LIMIT = 25_000;

/** Internal paste steps into compose (not separate sends). */
export const PLATFORM_PASTE_LIMITS = {
  chatgpt: 8_000,
  claude: 10_000,
  default: 8_000,
};

export const PLATFORM_SEND_LIMITS = {
  chatgpt: SEND_CHAR_LIMIT,
  claude: SEND_CHAR_LIMIT,
  default: SEND_CHAR_LIMIT,
};

export function getPasteLimit(adapterId) {
  return PLATFORM_PASTE_LIMITS[adapterId] ?? PLATFORM_PASTE_LIMITS.default;
}

export function getSendLimit(adapterId) {
  return PLATFORM_SEND_LIMITS[adapterId] ?? PLATFORM_SEND_LIMITS.default;
}

export function needsSendSplit(charCount) {
  return charCount > SEND_CHAR_LIMIT;
}
