const client_id =  process.env['GH_APP_CLIENT_ID'];
const client_secret = process.env['GH_APP_CLIENT_SECRET'];
const request = require('request-promise');
const octokit = require('@octokit/rest')();
const jwt = require('jsonwebtoken');

module.exports = {
    //Gets the url for starting Oauth2 flow.
    getIdentityRequestUrl: function(state, redirect_url) {
        return 'https://github.com/login/oauth/authorize' + 
            `?client_id=${client_id}&redirect_url=${redirect_url}` + 
            `&scope=user&state=${state}&allow_signup=false`;
    },
    
    //Retrieves access token by auth code (2nd stage of Oauth2).
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
    
    //Gets all the GitHub apps installed for the specified user (by his token).
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
    
    //Encapsulates GitHub logic accessed via GitHub app.
    createApp: function ({ id, cert}) {

        const status = {
            STARTED: {state: 'pending', description: 'Build started...'},
            PENDING: {state: 'pending', description: 'Build in App Center is in progress...'},
            SUCCEEDED: {state: 'success', description: 'App Center build successfully created.'},
            FAILED: {state: 'failure', description: 'Errors occurred during App Center build.'},
            FUNCTION_FAILED: {state: 'failure', description: 'Please configure your branch for build first.'}
        };

        //Authenticates as the GitHub app by private key.
        function asApp() {
            octokit.authenticate({ type: 'integration', token: generateJwt(id, cert) });
            return Promise.resolve(octokit);
        }

        // Authenticates as the given installation of the GitHub app, which gives us access to actions in user repo.
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

        //Gets json config file from the root of the user repository.
        function getConfig(username, repo, id) {
            return asInstallation(id).then(github => {
                return github.repos.getContent({ owner: username, repo: repo, path: 'appcenter-pr.json' });
            });
        }

        //Reports a status for the specified commit in repository. 
        //Include target_url if you want to override url in Details section of the status, otherwise leave it undefined.
        //If you specify the target_url, you can leave appcenter_owner, owner_type and branch blank or undefined.
        function reportGithubStatus(repo_name, sha, appcenter_owner, owner_type, app, branch, buildNumber, id, status, target_url) {
            return asInstallation(id).then(github => {
                return github.repos.createStatus({ owner: repo_name.split('/')[0], repo: repo_name.split('/')[1], sha: sha,
                    state: status.state,
                    target_url: target_url || `https://appcenter.ms/${owner_type}/${appcenter_owner}/apps/${app}/build/branches/${branch}/builds/${buildNumber}`,
                    description: status.description,
                    context: `appcenter-ci/${app}`} );
            });
        }

        //Generates jwt signature for GitHub app authentication from the private key and GitHub app id.
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
