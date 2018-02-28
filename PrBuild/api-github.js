const request = require('request-promise');

module.exports = {
    reportGithubStatus: function(repo_path, branch, sha, token, owner, owner_type, app, buildNumber) {
        const options = {
            headers: { 'Accept': 'application/json', 'User-Agent': 'appcenter-ci', 'Content-Type': 'application/json', 'Authorization': `token ${token}` },
            url: `https://api.github.com/repos/${repo_path}/statuses/${sha}`
        };

        var report = {
            state: 'pending',
            target_url: `https://appcenter.ms/${owner_type}/${owner}/apps/${app}/build/branches/${branch}/builds/${buildNumber}`,
            description: 'Running build in App Center...',
            context: `appcenter-ci/${app}`
        };

        Object.assign(options, { method: 'POST', body: JSON.stringify(report) });

        return request(options);
    }
};
