const request = require('request-promise');
const octokit = require('@octokit/rest')();
const jwt = require('jsonwebtoken')

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
    },

    createApp: function({id, cert, debug = false}) {
        function asApp () {
            const github = new octokit({debug});
            github.authenticate({type: 'integration', token: generateJwt(id, cert)});
            // Return a promise to keep API consistent
            return Promise.resolve(github);
        }

        // Authenticate as the given installation
        function asInstallation (installationId) {
            return createToken(installationId).then(res => {
                const github = new octokit({debug});
                github.authenticate({type: 'token', token: res.data.token});
                return github;
            })
        }

        // https://developer.github.com/early-access/integrations/authentication/#as-an-installation
        function createToken (installationId) {
            return asApp().then(github => {
                return github.apps.createInstallationToken({
                    installation_id: installationId
                });
            });
        }

        // Internal - no need to exose this right now
        function generateJwt (id, cert) {
            const payload = {
                iat: Math.floor(new Date() / 1000),       // Issued at time
                exp: Math.floor(new Date() / 1000) + 60,  // JWT expiration time
                iss: id                                   // Integration's GitHub id
            };

            // Sign with RSA SHA256
            return jwt.sign(payload, cert, {algorithm: 'RS256'})
        }

        return { asApp, asInstallation, createToken };
    }
};
