const commitTypes = Object.keys(require('conventional-commit-types').types);
const dedent = require('dedent');
const os = require('os');
const {isObject, tryCatch, isValidString} = require('./utils.js');

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
    console.log("result", result)

    const {scope, type} = result.header;
    const isScopeValid = !validScopes || !scope || validScopes.includes(scope);
    return (validTypes || commitTypes).includes(type) && isScopeValid;
}


function validate(commits, ret = false) {
  return tryCatch(() => check(commits), ret);
}

function check(commits, flat) {
  const result = []
    .concat(commits)
    .filter((x) => x !== null || x !== undefined)
    .reduce((acc, commit) => {
      if (typeof commit === 'string') {
        commit = parseCommit(commit);
      }
      console.log("commit", commit)
      return acc.concat(checkCommit(commit));
    }, []);

  return flat === true && result.length === 1 ? result[0] : result;
}

function parseCommit(commit) {
  if (!isValidString(commit)) {
    throw new TypeError(`expect \`commit\` to be non empty string`);
  }

  const parts = commit.split(os.EOL);
  const commitHeader = parts.length > 1 ? parts[0] : commit;
  console.log("commitHeader", commitHeader)

  const regex = /^(\w+)(?:\((.+)\))?: (.+)$/i;
  if (!regex.test(commitHeader)) {
    throw new TypeError(errorMsg);
  }
  const [type, scope = null, subject] = regex.exec(commitHeader).slice(1);
  const header  = { type, scope, subject }
console.log("header", header)
  const [body = null, footer = null] = commit.split('\n\n').slice(1);

  return { header, body, footer };
}


function checkCommit(commit) {
  if (!isObject(commit)) {
    const msg = `{ header: Header, body?, footer? }`;
    throw new TypeError(`expect \`commit\` to be an object: ${msg}`);
  }

  const { error, value: header } = validateHeader(commit.header);
  if (error) {
    throw error;
  }

  const isValidBody =
    'body' in commit && commit.body !== null
      ? typeof commit.body === 'string'
      : true;

  if (!isValidBody) {
    throw new TypeError('commit.body should be string when given');
  }

  const isValid =
    'footer' in commit && commit.footer !== null
      ? typeof commit.footer === 'string'
      : true;

  if (!isValid) {
    throw new TypeError('commit.footer should be string when given');
  }
    console.log('eee', Object.assign({ body: null, footer: null }, commit, { header }))
  return Object.assign({ body: null, footer: null }, commit, { header });
}

function validateHeader(header) {
   header = (header && header.header) || header;

  if (!isObject(header)) {
    const msg = `{ type: string, scope?: string, subject: scope }`;
    throw new TypeError(`expect \`header\` to be an object: ${msg}`);
  }
  if (!isValidString(header.type)) {
    throw new TypeError('header.type should be non empty string');
  }
  if (!isValidString(header.subject)) {
    throw new TypeError('header.subject should be non empty string');
  }

  const isValidScope =
    'scope' in header && header.scope !== null
      ? isValidString(header.scope)
      : true;

  if (!isValidScope) {
    throw new TypeError(
      'commit.header.scope should be non empty string when given',
    );
  }

  return Object.assign({ scope: null }, header);
 }
