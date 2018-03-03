const request = require('request-promise');

const octokit = require('@octokit/rest')();
const jwt = require('jsonwebtoken')

module.exports = {
    createApp: function ({ id, cert, debug = false }) {
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
            })
        }

        // https://developer.github.com/early-access/integrations/authentication/#as-an-installation
        function createToken(installationId) {
            return asApp().then(github => {
                return github.apps.createInstallationToken({ installation_id: installationId });
            });
        }

        function getConfig(username, repo, id) {
            return asInstallation(id).then(github => {
                return github.repos.getContent({ owner: username, repo: repo, path: "prcheck_config.json" });
            });
        }

        function reportGithubStatus(github_owner, repo, sha, appcenter_owner, owner_type, app, branch, buildNumber, id) {
            return asInstallation(id).then(github => {
                return github.repos.createStatus({ owner: github_owner, repo: repo, sha: sha,
                    state: 'pending',
                    target_url: `https://appcenter.ms/${owner_type}/${appcenter_owner}/apps/${app}/build/branches/${branch}/builds/${buildNumber}`,
                    description: 'Running build in App Center...',
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
            return jwt.sign(payload, cert, { algorithm: 'RS256' })
        }

        return { asApp, asInstallation, createToken, getConfig, reportGithubStatus };
    }
};
