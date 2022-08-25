function tryCatch(fn, ret) {
  const result = {};
  try {
    result.value = fn();
  } catch (err) {
    result.error = err;
  }
  return ret ? result : !result.error;
}

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

export function isValidString(x) {
  return Boolean(typeof x === 'string' && x.length > 0);
}