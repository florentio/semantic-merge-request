import { EOL } from 'os';
const commitTypes = Object.keys(require('conventional-commit-types').types);
const validate = require('parse-commit-message');
const dedent = require('dedent');

const errorMsg = dedent`parse-commit-message: expect \`commit\` to follow:
<type>[optional scope]: <description>
[optional body]
[optional footer]`;

module.exports = function isSemanticMessage(message, validScopes, validTypes, allowMergeCommits, allowRevertCommits) {
    const isMergeCommit = message && message.startsWith('Merge');
    if (allowMergeCommits && isMergeCommit) return true;

    const isRevertCommit = message && message.startsWith('Revert');
    if (allowRevertCommits && isRevertCommit) return true;

    const {error, value: commits} = validate(message, true);

    if (error) {
        if (process.env.NODE_ENV === 'test') console.error(error);
        return false;
    }

    const [result] = commits;
    const {scope, type} = result.header;
    const isScopeValid = !validScopes || !scope || validScopes.includes(scope);
    return (validTypes || commitTypes).includes(type) && isScopeValid;
}


/**
 * Validates a single or multiple commit message(s) in form of string,
 * object, array of strings, array of objects or mixed.
 * You may want to pass `ret` to return an object instead of throwing.
 *
 * console.log(validate('foo bar qux')); // false
 * console.log(validate('foo: bar qux')); // true
 * console.log(validate('fix(ci): bar qux')); // true
 *
 * console.log(validate(['a bc cqux', 'foo bar qux'])); // false
 *
 * console.log(validate({ qux: 1 })); // false
 * console.log(validate({ header: { type: 'fix' } })); // false
 * console.log(validate({ header: { type: 'fix', subject: 'ok' } })); // true
 *
 * const commitObject = {
 *   header: { type: 'test', subject: 'updating tests' },
 *   foo: 'bar',
 *   isBreaking: false,
 *   body: 'oh ah',
 * };
 * console.log(validate(commitObject)); // true
 *
 * const result = validate('foo bar qux', true);
 * console.log(result.error);
 * // => Error: expect \`commit\` to follow:
 * // <type>[optional scope]: <description>
 * //
 * // [optional body]
 * //
 * // [optional footer]
 *
 * const res = validate('fix(ci): okey barry', true);
 * console.log(result.value);
 * // => [{
 * //   header: { type: 'fix', scope: 'ci', subject: 'okey barry' },
 * //   body: null,
 * //   footer: null,
 * // }]
 *
 * const commit = { header: { type: 'fix' } };
 * const { error } = validate(commit, true);
 * console.log(error);
 * // => TypeError: header.subject should be non empty string
 *
 *
 * const commit = { header: { type: 'fix', scope: 123, subject: 'okk' } };
 * const { error } = validate(commit, true);
 * console.log(error);
 * // => TypeError: header.scope should be non empty string when given
 *
 * @name  .validate
 * @param {string|object|array} commits a value to be parsed & validated into an object like `Commit` type
 * @param {boolean} [ret] to return result instead of throwing, default `false`
 * @returns {boolean|object} if `ret` is `true` then returns `{ value, error }` object,
 *                          where `value` is `Commit|Array<Commit>` and `error` a standard `Error`
 */
function validateCommit(commit, ret = false) {
  return tryCatch(() => checkCommit(commit), ret);
}


/**
 * Receives a single or multiple commit message(s) in form of string,
 * object, array of strings, array of objects or mixed.
 *
 * Basically the return result is the same as if you run `.validate()` with
 * the `ret` option, but instead it throws if find problems.
 *
 *
 * try {
 *   check({ header: { type: 'fix' } });
 * } catch(err) {
 *   console.log(err);
 *   // => TypeError: header.subject should be non empty string
 * }
 *
 * // Can also validate/check a strings, array of strings,
 * // or even mixed - array of strings and objects
 * try {
 *   check('fix(): invalid scope, it cannot be empty')
 * } catch(err) {
 *   console.log(err);
 *   // => TypeError: header.scope should be non empty string when given
 * }
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
      if (typeof commit === 'string') {
        commit = parseCommit(commit);
      }
      return acc.concat(checkCommit(commit));
    }, []);

  return flat === true && result.length === 1 ? result[0] : result;
}

/**
 * Receives a full commit message `string` and parses it into an `Commit` object
 * and returns it.
 * Basically the same as [.parse](#parse), except that
 * it only can accept single string.
 *
 * _The `parse*` methods are not doing any checking and validation,
 * so you may want to pass the result to `validateCommit` or `checkCommit`,
 * or to `validateCommit` with `ret` option set to `true`._
 *
 *
 * const commitObj = parseCommit('foo: bar qux\n\nokey dude');
 * console.log(commitObj);
 * // => {
 * //   header: { type: 'foo', scope: null, subject: 'bar qux' },
 * //   body: 'okey dude',
 * //   footer: null,
 * // }
 *
 * @name  .parseCommit
 * @param {string} commit a message like `'fix(foo): bar baz\n\nSome awesome body!'`
 * @returns {Commit} a standard object like `{ header: Header, body?, footer? }`
 * @public
 *//*

function parseCommit(commit) {
  if (!isValidString(commit)) {
    throw new TypeError(`expect \`commit\` to be non empty string`);
  }

  const header = parseHeader(commit);
  const [body = null, footer = null] = commit.split('\n\n').slice(1);

  return { header, body, footer };
}


*/
/**
 * Parses given `header` string into an header object.
 * Basically the same as [.parse](#parse), except that
 * it only can accept single string and returns a `Header` object.
 *
 * _The `parse*` methods are not doing any checking and validation,
 * so you may want to pass the result to `validateHeader` or `checkHeader`,
 * or to `validateHeader` with `ret` option set to `true`._

 *
 * const longCommitMsg = `fix: bar qux
 *
 * Awesome body!`;
 *
 * const headerObj = parseCommit(longCommitMsg);
 * console.log(headerObj);
 * // => { type: 'fix', scope: null, subject: 'bar qux' }
 *
 * @name  .parseHeader
 * @param {string} header a header stirng like `'fix(foo): bar baz'`
 * @returns {Header} a `Header` object like `{ type, scope?, subject }`
 * @public
 *//*

function parseHeader(header) {
  if (!isValidString(header)) {
    throw new TypeError('expect `header` to be non empty string');
  }

  const parts = header.split(EOL);
  header = parts.length > 1 ? parts[0] : header;

  const regex = /^(\w+)(?:\((.+)\))?: (.+)$/i;
  if (!regex.test(header)) {
    throw new TypeError(errorMsg);
  }
  const [type, scope = null, subject] = regex.exec(header).slice(1);

  return { type, scope, subject };
}

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
}*/
