module.exports = {
    tryCatch : function(fn, ret) {
      const result = {};
      try {
        result.value = fn();
      } catch (err) {
        result.error = err;
      }
      return ret ? result : !result.error;
    },
    isObject : function(val) {
      return val && typeof val === 'object' && !Array.isArray(val);
    },
    isValidString = function(x) {
      return Boolean(typeof x === 'string' && x.length > 0);
    }
};