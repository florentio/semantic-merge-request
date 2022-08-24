/**
 * Get merge request detail
 */
const api = require('merge-request-api');

/**
 * Get merge request detail
 *

 * @param {string} projectApiUrl gitlab project api url
 * @param {string} token gitlab access token in order to make api call
 * @param {string} mrId Id of the merge request
 * @returns {object}
 * @async
 */

module.exports =  async function getMergeRequestDetail(projectApiUrl, token, mrId) {
    const response = await api.makeRequest({
        method: 'get',
        url: projectApiUrl + '/merge_requests/' + mrId ,
        headers: {'PRIVATE-TOKEN': token}
    });
    if (response != null && response.status === 200) {
        return {
            draft : response.data.draft,
            work_in_progress : response.data.work_in_progress
        };
    }
    return null;
}
