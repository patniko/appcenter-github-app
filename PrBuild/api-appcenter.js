const request = require('request-promise');

module.exports = {
    getBuildConfiguration: function (branch, token, owner, app) {
        const endpoint = `/branches/${branch}/config`;
        var options = BuildUrl(endpoint, token, owner, app);
        return request(options).then(() => { }, (error) => {
            if (error.statusCode === 404) {
                error.message = error.message + "Error: 404 Not Found. Please check you have pasted valid appcenter owner, owner type and app name in config.json.";
                return Promise.reject(error)
            } else if (error.statusCode == 401) {
                error.message = error.message + "Error: 401 Unauthorized. Could not login to appCenter. Please check you have pasted valid appcenter token in local.settings.json.";
                return Promise.reject(error);
            } else {
                return Promise.reject(error);
            }
        });
    },
    createPrBuildConfiguration: function (config, branch, token, owner, app) {
        // Disable distribute on build and change name over to new branch
        config.toolsets.distribution = {};
        config.branch.name = branch;
        config.trigger = 'continuous';

        const options = BuildUrl(`/branches/${branch}/config`, token, owner, app);
        Object.assign(options, { method: 'POST', body: JSON.stringify(config) });
        return request(options);
    },
    startPrBuild: function (branch, sha, token, owner, app) {
        const payload = { sourceVersion: sha };

        const options = BuildUrl(`/branches/${branch}/builds`, token, owner, app);
        Object.assign(options, { method: 'POST', body: JSON.stringify(payload) });
        return request(options);
    },
    deletePrBuildConfiguration: function (branch, token, owner, app) {
        const options = BuildUrl(`/branches/${branch}/config`, token, owner, app);
        Object.assign(options, { method: 'DELETE' });
        return request(options);
    }
};

function BuildUrl(endpoint, token, owner, app) {
    const options = {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-API-Token': token },
        url: `https://api.appcenter.ms/v0.1/apps/${owner}/${app}${endpoint}`
    };
    return options;
}
