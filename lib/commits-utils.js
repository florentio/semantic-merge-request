const os = require("os");
const { isObject, tryCatch, isValidString } = require("./utils.js");
const dedent = require("dedent");

const errorMsg = dedent`validate-commit-error: expect \`commit\` to follow:
<type>[optional scope]: <description>
[optional body]
[optional footer]`;

module.exports = {
  /**
   * Receives a full commit message `string` and parses it into an `Commit` object
   * and returns it.
   *
   * @name  .parseCommit
   * @param {string} commit a message like `'fix(foo): bar baz\n\nSome awesome body!'`
   * @returns {Commit} a standard object like `{ header: Header, body?, footer? }`
  */
  parseCommit: function (commit) {
    if (!isValidString(commit)) {
      throw new TypeError(`expect \`commit\` to be non empty string`);
    }

    const parts = commit.split(os.EOL);
    const commitHeader = parts.length > 1 ? parts[0] : commit;

    const regex = /^(\w+)(?:\((.+)\))?: (.+)$/i;
    if (!regex.test(commitHeader)) {
      throw new TypeError(errorMsg);
    }
    const [type, scope = null, subject] = regex.exec(commitHeader).slice(1);
    const header = { type, scope, subject };
    const [body = null, footer = null] = commit.split("\n\n").slice(1);

    return { header, body, footer };
  },
  /**
   * Receives a `Commit` and checks if it is valid. Method throws if problems found.
   * @name  .checkCommit
   * @param {Commit} commit a `Commit` like `{ header: Header, body?, footer? }`
   * @returns {Commit} returns the same as given if no problems, otherwise it will throw.
  */
  checkCommit: function (commit) {
    if (!isObject(commit)) {
      const msg = `{ header: Header, body?, footer? }`;
      throw new TypeError(`expect \`commit\` to be an object: ${msg}`);
    }

    const { error, value: header } = validateHeader(commit.header, true);
    if (error) {
      throw error;
    }

    const isValidBody =
      "body" in commit && commit.body !== null
        ? typeof commit.body === "string"
        : true;

    if (!isValidBody) {
      throw new TypeError("commit.body should be string when given");
    }

    const isValid =
      "footer" in commit && commit.footer !== null
        ? typeof commit.footer === "string"
        : true;

    if (!isValid) {
      throw new TypeError("commit.footer should be string when given");
    }

    return Object.assign({ body: null, footer: null }, commit, { header });
  },
};

/**
 * Validates given `header` object and returns `boolean`.
 * You may want to pass `ret` to return an object instead of throwing.
 * it only can accept single `Header` object.
 *
 * @name  .validateHeader
 * @param {Header} header a `Header` object like `{ type, scope?, subject }`
 * @param {boolean} [ret] to return result instead of throwing, default `false`
 * @returns {boolean|object} if `ret` is `true` then returns `{ value, error }` object,
 *                          where `value` is `Header` and `error` a standard `Error`
 */
function validateHeader(header, ret = false) {
  return tryCatch(() => checkHeader(header), ret);
}

/**
 * Receives a `Header` and checks if it is valid.
 * it only can accept single `Header` object.
 *
 * @name  .checkHeader
 * @param {Header} header a `Header` object like `{ type, scope?, subject }`
 * @returns {Header} returns the same as given if no problems, otherwise it will throw.
 */
function checkHeader(header) {
  header = (header && header.header) || header;

  if (!isObject(header)) {
    const msg = `{ type: string, scope?: string, subject: scope }`;
    throw new TypeError(`expect \`header\` to be an object: ${msg}`);
  }
  if (!isValidString(header.type)) {
    throw new TypeError("header.type should be non empty string");
  }
  if (!isValidString(header.subject)) {
    throw new TypeError("header.subject should be non empty string");
  }

  const isValidScope =
    "scope" in header && header.scope !== null
      ? isValidString(header.scope)
      : true;

  if (!isValidScope) {
    throw new TypeError(
      "commit.header.scope should be non empty string when given",
    );
  }

  return Object.assign({ scope: null }, header);
}
