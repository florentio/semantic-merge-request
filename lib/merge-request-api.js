

const axios = require('axios');

/**
 * Api call to gitlab
 *
 * @param {object} config 
 * @returns {object} api http response
 * @async
 */
export async function makeRequest(param) {
  try {
    const response = await axios(param);
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (e) {
    return null;
  }
}
