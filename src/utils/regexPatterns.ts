export const RHexadecimalStringWithoutPrefix = /^(0x[0-9a-fA-F]+)|([0-9a-fA-F]+)$/;

// https://regex101.com/r/mX1xW0/1
export const REmailRegexPattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;

// JS ISO Date type: '1000-03-03T00:00:00.000Z', based on ISO8601
export const RJavascriptISODatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/; // need to revalidate date validity with Date()
