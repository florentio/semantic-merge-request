

const axios = require('axios');

/**
 * Api call to gitlab
 *
 * @param {object} config 
 * @returns {object} api http response
 * @async
 */
module.exports = async function makeRequest(param) {
  try {
    console.log(JSON.stringify(param))
    const response = await axios(param);
    if (response.status === 200 || response.status === 201 || response.status === 202) {
      return response;
    }
    return null;
  } catch (e) {
    return null;
  }
}
