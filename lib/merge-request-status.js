/**
 * Create status check
 */

//import * as api from './merge-request-api';

const makeRequest = require('./merge-request-api');

/**
 * Create status for the check
 *
 * Use the gitlab merge request api to create a status
 *
 * @param {string} projectApiUrl gitlab project api url
 * @param {string} token gitlab access token
 * @param {string} mrId  Id of the merge request
 * @param {string} status status of check
 * @returns {object}
 * @async
 */

module.exports = async function createStatus(projectApiUrl, token, mrId, status) {
    const response = await makeRequest({
        method: 'get',
        url: projectApiUrl + '/merge_requests/' + mrId,
        headers: { 'PRIVATE-TOKEN': token }
    });
    if (response != null && response.status === 200) {
        const result = await makeRequest({
            method: 'post',
            url: projectApiUrl + '/statuses/' + response.data.sha,
            data: status,
            headers: { 'PRIVATE-TOKEN': token }
        });
        if (result.status === 200) {
            return result.data;
        }
        return null;
    }
    return null;
}

