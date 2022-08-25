/**
 * Read .gitlab/semantic.yml configuration file
 */

const yaml = require('js-yaml');
const merge = require('deepmerge');
const makeRequest = require('./merge-request-api');

/**
 * Decodes and parses a YAML config file
 *
 * @param {string} content Base64 encoded YAML contents
 * @returns {object} The parsed YAML file as native object
 */
function parseConfig(content) {
    return yaml.load(Buffer.from(content, 'base64').toString()) || {};
}

/**
 * Merges an array of configs
 *
 * @param {array<config>} configs The configs to merge
 * @returns {object} The merged configuration
 */
function deepMergeConfigs(configs) {
    return merge.all(
        configs.filter((config) => config)
    );
}

/**
 * Loads the specified config file based on it's Base64 encoded content
 *
 * If the config content cannot be parsed, `null`
 * is returned.
 *
 * If a default config is given, it is merged with the config from the
 * repository, if it exists.
 *
 * @param {string} content Base64 encoded YAML contents
 * @param {object} defaultConfig A default config that is merged in
 * @returns {object} The merged configuration
 */
function getConfig(content, defaultConfig) {
    const config = parseConfig(content);
    console.log("config", config)
    if (config == null && !defaultConfig) return null;
    return deepMergeConfigs([defaultConfig, config]);
}

/**
 * Loads the specified config file from a given repository and branch
 *
 * Use the gitlab repository file api to get the content of .gitlab/semantic.yml file
 *
 * If the file doesn't exist in te give repository/branch, return empty object

 * If a default config is given, it is merged with the config read from the
 * repository, if it exists.
 *
 * @param {string} projectApiUrl gitlab project api url
 * @param {string} token gitlab access token in order to make api call
 * @param {string} branch the branch of the reposotory to be used
 * @param {object} defaultConfig the default config
 * @returns {object} The merged configuration
 * @async
 */
module.exports = async function getSemanticConfig(projectApiUrl, token, branch, defaultConfig) {
    const response = await makeRequest({
        method: 'get',
        url: projectApiUrl + '/repository/files/%2Egitlab%2Fsemantic%2Eyml?ref=' + branch,
        headers: { 'PRIVATE-TOKEN': token }
    });
    if (response != null && response.status === 200) {
        console.log(response.data.content)
        return getConfig(response.data.content, defaultConfig);
    }
    return {};
}
