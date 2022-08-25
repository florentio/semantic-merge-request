

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
    console.log(response.status)
    console.log(response.data)
    if (response.status === 200 || response.status === 201) {
      return response;
    }
    return null;
  } catch (e) {
    console.log(e)
    return null;
  }
}
