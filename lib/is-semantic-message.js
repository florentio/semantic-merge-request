const commitTypes = Object.keys(require('conventional-commit-types').types);
const dedent = require('dedent');
const {tryCatch} = require('./utils.js');
const {parseCommit, checkCommit} = require('./commits-utils.js');

const errorMsg = dedent`parse-commit-message: expect \`commit\` to follow:
<type>[optional scope]: <description>
[optional body]
[optional footer]`;

module.exports = function isSemanticMessage(message, validScopes, validTypes, allowMergeCommits, allowRevertCommits) {
    const isMergeCommit = message && message.startsWith('Merge');
    if (allowMergeCommits && isMergeCommit) return true;

    const isRevertCommit = message && message.startsWith('Revert');
    if (allowRevertCommits && isRevertCommit) return true;

    const {error, commits} = validate(message, true);
    console.log("result", {error, commits})
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
        commit = parseCommit(commit); // eslint-disable-line no-param-reassign
      }
      return acc.concat(checkCommit(commit));
    }, []);

  return flat === true && result.length === 1 ? result[0] : result;
}