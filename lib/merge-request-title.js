/**
 * Update the title of the merge request
 */

const makeRequest = require('./merge-request-api');
/**
 * Update the title of the merge request
 *
 * Use the gitlab merge request api to update the title of a merge request
 *
 *
 * @param {string} base_url api base url
 * @param {string} token gitlab access token in order to make api call
 * @param {string} project_id the ID of the repository
 * @param {string} mr_id the ID of the merge request
 * @param {string} mr_data the title of the merge request
 * @async
 */

module.exports =  async function updateMRTitle(projectApiUrl, token, projectId, mrId, mrData) {
    const response = await makeRequest({
        method: 'put',
        url: projectApiUrl + '/projects/' + project_id +'/merge_requests/' + mrId ,
        headers: {'PRIVATE-TOKEN': token}
    });
    if (response != null && response.status === 200) {
        return response.data;
    }
    return null;
}


