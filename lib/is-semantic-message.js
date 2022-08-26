const commitTypes = Object.keys(require("conventional-commit-types").types);
const { tryCatch } = require("./utils.js");
const { parseCommit, checkCommit } = require("./commits-utils.js");


/**
 * Check if a message is `semantic` nor not
 *
 * @param {string} message a message to check
 * @param {array} validScopes array of scope to use to check the message
 * @param {array} validTypes array of message type  to use to check the message
 * @param {boolean} allowMergeCommits validate automatically Merge commit
 * @param {boolean} allowRevertCommits validate automatically Revert commit
 * @returns {boolean} return if the message is semantic or not
 */
module.exports = function isSemanticMessage(
  message,
  validScopes,
  validTypes,
  allowMergeCommits,
  allowRevertCommits,
) {
  const isMergeCommit = message && message.startsWith("Merge");
  if (allowMergeCommits && isMergeCommit) return true;

  const isRevertCommit = message && message.startsWith("Revert");
  if (allowRevertCommits && isRevertCommit) return true;

  const { error, value: commits } = validate(message, true);
  if (process.env.NODE_ENV === "DEBUG")
    console.log("validate", { error, value: JSON.stringify(commits) });
  if (error) {
    if (process.env.NODE_ENV === "DEBUG") console.error(error);
    return false;
  }

  const [result] = commits;
  const { scope, type } = result.header;
  const isScopeValid = !validScopes || !scope || validScopes.includes(scope);
  return (validTypes || commitTypes).includes(type) && isScopeValid;
};


/**
 * Validates a single or multiple commit message(s) in form of string,
 * object, array of strings, array of objects or mixed.
 * You may want to pass `ret` to return an object instead of throwing.
 *
 * @param {string|object|array} commits a value to be parsed & validated into an object like `Commit` type
 * @param {boolean} [ret] to return result instead of throwing, default `false`
 * @returns {boolean|object} if `ret` is `true` then returns `{ value, error }` object,
 *                          where `value` is `Commit|Array<Commit>` and `error` a standard `Error`
 */
function validate(commits, ret = false) {
  return tryCatch(() => check(commits), ret);
}


/**
 * Receives a single or multiple commit message(s) in form of string,
 * object, array of strings, array of objects or mixed.
 *
 * Basically the return result is the same as if you run `validate()` with
 * the `ret` option, but instead it throws if find problems.
 *
 * @name  .check
 * @param {string|object|array} commits a value to be parsed & validated into an object like `Commit` type
 * @param {boolean} [flat] if the returned result length is 1, then returns the first item
 * @returns {Array<Commit>} returns the same as given if no problems, otherwise it will throw;
 *                     if `flat: true`, returns a `Commit`
 */
function check(commits, flat) {
  const result = []
    .concat(commits)
    .filter((x) => x !== null || x !== undefined)
    .reduce((acc, commit) => {
      if (typeof commit === "string") {
        commit = parseCommit(commit);
      }
      return acc.concat(checkCommit(commit));
    }, []);

  return flat === true && result.length === 1 ? result[0] : result;
}
