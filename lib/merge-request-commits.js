/**
 * Get merge request commits
 */
const makeRequest = require('./merge-request-api');

/**
 * Get the list of commits of merge requets
 *
 * Use the gitlab repository file api to get the list of commits for a merge request
 * given it's id
 *
 * @param {string} projectApiUrl gitlab project api url
 * @param {string} token gitlab access token in order to make api call
 * @param {string} mrId Id of the merge request
 * @returns {array} list of the commits
 * @async
 */

module.exports = async function getMergeRequestCommits(projectApiUrl, token, mrId) {
    const response = await makeRequest({
        method: 'get',
        url: projectApiUrl + '/merge_requests/' + mrId + '/commits',
        headers: { 'PRIVATE-TOKEN': token }
    });
    if (response != null && response.status === 200) {
        let commits = response.data;
        return commits.map((commits) => commits.message);
    }
    return [];
}
