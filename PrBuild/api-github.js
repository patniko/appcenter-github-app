const request = require('request-promise');

module.exports = {
    reportGithubStatus: function (repo_path, branch, sha, token, owner, owner_type, app, buildNumber) {
        const options = {
            headers: { 'Accept': 'application/json', 'User-Agent': 'appcenter-ci', 'Content-Type': 'application/json', 'Authorization': `token ${token}` },
            url: `https://api.github.com/repos/${repo_path}/statuses/${sha}`
        };

        var report = {
            state: 'pending',
            target_url: `https://appcenter.ms/${owner_type}/${owner}/apps/${app}/build/branches/${branch}/build/${buildNumber}`,
            description: 'Running build in App Center...',
            context: `appcenter-ci/${app}`
        };

        Object.assign(options, { method: 'POST', body: JSON.stringify(report) });

        return request(options).then(() => { },
            (error) => {
                if (error.statusCode == 404 || error.statusCode == 401) {
                    return Promise.reject("Error sending status to github. Please check you have pasted valid github token, repo_owner and repo_name in local.settings.json and config.json.")
                } else {
                    return Promise.reject(error);
                }
            });
    }
};
