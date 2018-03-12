
const githubRequests = require('../api/github');
const github_app_id = process.env['GITHUB_APP_ID'];
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const appcenter_pem = fs.readFileSync(path.resolve(__dirname, '../appcenter.pem')); 
const app = githubRequests.createApp({
    id: github_app_id,
    cert: appcenter_pem
});
const installationDao = require('../db/index').getAppInstallationsDao();

module.exports = function (sha, repo_path, installation_id, succeeded, branch, buildId, appcenter_app) {
    try {
        return app.reportGithubStatus(
            repo_path,
            sha,
            appcenter_app.split('/')[1],
            appcenter_app.split('/')[0],
            appcenter_app.split('/')[2],
            branch,
            buildId * 1,
            installation_id * 1,
            !!succeeded ? app.status.SUCCEEDED : app.status.FAILED
        );
    } catch (error) {
        Promise.reject(error);
    }
};
