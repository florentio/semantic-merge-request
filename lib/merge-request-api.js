

const axios = require('axios');

/**
 * Api call to gitlab
 *
 * @param {object} config 
 * @returns {object} api http response
 * @async
 */
module.exports =  async function makeRequest(param) {
  try {
    console.log(JSON.stringify(param))
    const response = await axios(param);
    console.log(response)
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (e) {
    return null;
  }
}
