const client_id =  "Iv1.d9ce1c50b5dcf89c";
const client_secret = "6dbf0f9ae6b3a8bdd587f247141106c2f4a9bf99";
const request = require('request-promise');
const octokit = require('@octokit/rest')();
const jwt = require('jsonwebtoken');

module.exports = {
    getIdentityRequestUrl: function(state, redirect_url) {
        return 'https://github.com/login/oauth/authorize' + 
            `?client_id=${client_id}&redirect_url=${redirect_url}` + 
            `&scope=user&state=${state}&allow_signup=false`;
    },
    getAccessToken: function(state, code, redirect_url) {
        const location = 'https://github.com/login/oauth/access_token' +
            `?client_id=${client_id}&client_secret=${client_secret}` +
            `&code=${code}&state=${state}&redirect_url=${redirect_url}`;
        const options = {
            url: location,
            method: 'POST'
        };
        return request(options);
    },
    getUserApps: function(token) {
        const options = {
            url: `https://api.github.com/user/installations?access_token=${token}`,
            method: 'GET',
            headers: { 
                'Accept': 'application/vnd.github.machine-man-preview+json', 
                'Content-Type': 'application/json',
                'User-Agent': 'node.js'
            }
        };
        return request(options);
    },

    createApp: function ({ id, cert, debug = false }) {

        var status = {
            PENDING: {state: "pending", description: "Running build in App Center..."},
            SUCCEEDED: {state: "success", description: "App Center build successfully created."},
            FAILED: {state: "failure", description: "Errors occurred during App Center build."}
        };

        function asApp() {
            octokit.authenticate({ type: 'integration', token: generateJwt(id, cert) });
            // Return a promise to keep API consistent
            return Promise.resolve(octokit);
        }

        // Authenticate as the given installation
        function asInstallation(installationId) {
            return createToken(installationId).then(res => {
                octokit.authenticate({ type: 'token', token: res.data.token });
                return octokit;
            });
        }

        // https://developer.github.com/early-access/integrations/authentication/#as-an-installation
        function createToken(installationId) {
            return asApp().then(github => {
                return github.apps.createInstallationToken({ installation_id: installationId });
            });
        }

        function getConfig(username, repo, id) {
            return asInstallation(id).then(github => {
                return github.repos.getContent({ owner: username, repo: repo, path: 'prcheck_config.json' });
            });
        }

        function reportGithubStatus(repo_name, sha, appcenter_owner, owner_type, app, branch, buildNumber, id, status) {
            return asInstallation(id).then(github => {
                return github.repos.createStatus({ owner: repo_name.split('/')[0], repo: repo_name.split('/')[1], sha: sha,
                    state: status.state,
                    target_url: `https://appcenter.ms/${owner_type}/${appcenter_owner}/apps/${app}/build/branches/${branch}/builds/${buildNumber}`,
                    description: status.description,
                    context: `appcenter-ci/${app}`} );
            });
        }

        // Internal - no need to exose this right now
        function generateJwt(id, cert) {
            const payload = {
                iat: Math.floor(new Date() / 1000),       // Issued at time
                exp: Math.floor(new Date() / 1000) + 60,  // JWT expiration time
                iss: id                                   // Integration's GitHub id
            };

            // Sign with RSA SHA256
            return jwt.sign(payload, cert, { algorithm: 'RS256' });
        }

        return { asApp, asInstallation, createToken, getConfig, reportGithubStatus, status };
    }
 

};