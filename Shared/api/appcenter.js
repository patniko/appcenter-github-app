const request = require('request-promise');

module.exports = {
    //Gets the specified AppCenter app by its name and owner.
    getApp: function(token, owner, app) {
        const options = BuildUrl('', token, owner, app);
        Object.assign(options, { method: 'GET' });
        return request(options);
    },
    //Gets the specified app's repository configuration (info about the linked GitHub repo).
    getConfig: function(token, owner, app) {
        const options = BuildUrl('/repo_config', token, owner, app);
        Object.assign(options, { method: 'GET' });
        return request(options);
    },
    //Gets all apps in AppCenter by owner's token.
    getAllApps: function(token) {
        const options = {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-API-Token': token },
            url: 'https://api.appcenter.ms/v0.1/apps/'
        };
        Object.assign(options, { method: 'GET' });
        return request(options);
    },
    //Gets the build configuration of the specified branch.
    getBuildConfiguration: function(branch, token, owner, app) {
        const endpoint = `/branches/${encodeURIComponent(branch)}/config`;
        const options = BuildUrl(endpoint, token, owner, app);
        return request(options);
    },
    //Creates a build configuration on the specified branch.
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

        const options = BuildUrl(`/branches/${encodeURIComponent(branch)}/config`, token, owner, app);
        Object.assign(options, { method: 'POST', body: JSON.stringify(config) });
        return request(options);
    },
    //Starts AppCenter branch build.
    startPrCheck: function(branch, sha, token, owner, app) {
        const payload = { sourceVersion: sha };

        const options = BuildUrl(`/branches/${encodeURIComponent(branch)}/builds`, token, owner, app);
        Object.assign(options, { method: 'POST', body: JSON.stringify(payload) });
        return request(options);
    },
    //Deletes AppCenter branch build configuration.
    deletePrCheckConfiguration: function(branch, token, owner, app) {
        const options = BuildUrl(`/branches/${encodeURIComponent(branch)}/config`, token, owner, app);
        Object.assign(options, { method: 'DELETE' });
        return request(options);
    },
    //Gets the specified branch builds.
    getBuilds: function(branch, token, owner, app) {
        const options = BuildUrl(`/branches/${encodeURIComponent(branch)}/builds`, token, owner, app);
        Object.assign(options, { method: 'GET' });
        return request(options);
    },
    //Gets the specified build by build id.
    getBuild: function(build_id, token, owner, app) {
        const options = BuildUrl(`/builds/${build_id}`, token, owner, app);
        Object.assign(options, { method: 'GET' });
        return request(options);
    },
    //Stops (cancels) the specified build by build id.
    stopBuild: function(build_id, token, owner, app) {
        const payload = { status: 'cancelling' };
        const options = BuildUrl(`/builds/${build_id}`, token, owner, app);
        Object.assign(options, { method: 'PATCH' , body: JSON.stringify(payload)});
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
