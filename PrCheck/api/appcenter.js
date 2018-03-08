const request = require('request-promise');

module.exports = {
    getApp: function(token, owner, app) {
        var options = BuildUrl('', token, owner, app);
        Object.assign(options, { method: 'GET' });
        return request(options);
    },
    getBuildConfiguration: function(branch, token, owner, app) {
        const endpoint = `/branches/${branch}/config`;
        var options = BuildUrl(endpoint, token, owner, app);
        return request(options);
    },
    createPrCheckConfiguration: function(config, branch, token, owner, app) {
        // Force simulator build, disable distribute on build, signing 
        // and change name over to new branch
        config.toolsets.distribution = {};
        config.branch.name = branch;
        config.trigger = 'continuous';
        config.signed = false;
        if(config.xamarin) {
            config.isSimBuild = true;
        }

        const options = BuildUrl(`/branches/${branch}/config`, token, owner, app);
        Object.assign(options, { method: 'POST', body: JSON.stringify(config) });
        return request(options);
    },
    startPrCheck: function(branch, sha, token, owner, app) {
        const payload = { sourceVersion: sha };

        const options = BuildUrl(`/branches/${branch}/builds`, token, owner, app);
        Object.assign(options, { method: 'POST', body: JSON.stringify(payload) });
        return request(options);
    },
    deletePrCheckConfiguration: function(branch, token, owner, app) {
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
