const path = require('path');
const fs = require('fs');
const jwt = require('../Shared/jwt');
const pem = fs.readFileSync(path.resolve(__dirname, '../Shared/database-private.pem'));
const appCenterTokenForm = require('./actions/app-center-token-form');
const identityRedirectScript = require('./actions/identity-redirect');
const appInstallationsDao = require('../Shared/db/index').getAppInstallationsDao();
const github = require('../Shared/api/github');
const btoa = function (value) {
    return new Buffer(value).toString('base64');
};
const atob = function (encoded) {
    return new Buffer(encoded, 'base64').toString('ascii');
};

const processWebhookRequest = function (context, request) {
    if (request.query.installation_id) {
        const location = github.getIdentityRequestUrl(request.query.installation_id, request.headers.host + '/' + request.url);
        return identityRedirectScript(location);
    } else if (request.body) {
        const params = request.body.split('&');
        let gh_token;
        let token;
        for (let i = 0; i < params.length; i++) {
            if (params[i].startsWith('ghtoken')) {
                gh_token = params[i].split('=')[1];
            }
            if (params[i].startsWith('token')) {
                token = params[i].split('=')[1];
            }
        }
        if (!gh_token || !token) {
            Promise.resolve('Could not manage to store the token. Not valid information sent.');
        }
        gh_token = atob(gh_token);
        token = atob(token);
        return new Promise((resolve, reject) => {
            github.getUserApps(gh_token).then((apps) => {
                apps = JSON.parse(apps);
                let github_app_installation;
                if (apps.installations && apps.installations.length) {
                    const github_app_id = process.env['GITHUB_APP_ID'];
                    github_app_installation = apps.installations.filter((installation) => installation.app_id == github_app_id)[0];
                }
                if (!github_app_installation.id) {
                    reject('Could not manage to store the token. No installation of our app on this account found.');
                }
                //encode token
                const encoded_appcenter_token = jwt.sign({ token: token }, pem, { algorithm: 'RS256' });
                const item = {
                    installation_id: github_app_installation.id,
                    app_center_token: encoded_appcenter_token
                };
                appInstallationsDao.addItem(item).then(() => {
                    resolve('installation=' + github_app_installation.id);
                }).catch((err) => {
                    reject('Could not manage to store the token. ' + err || err.message || err.body);
                });
            }, (error) => {
                reject('Could not manage to store the token. Not valid github token sent.' + error || error.message);
            });
        });
    } else if (request.query.code && request.query.state) {
        return github.getAccessToken(request.query.state, request.query.code, request.headers.host + '/' + request.url)
            .then((response) => {
                const responses = response.split('&');
                const token = responses.find(elem => elem.startsWith('access_token')).split('=')[1];
                return appCenterTokenForm(btoa(token));
            });
    }
    return Promise.reject('Please post a valid webhook payload.');
};

const resolveContext = function (body, status) {
    this.res.setHeader('content-type', 'text/html; charset=utf-8');
    this.res.status = status;
    this.res.raw(body);
};

module.exports = function (context, request) {
    context.resolve = resolveContext;
    processWebhookRequest(context, request)
        .then(successMessage => context.resolve(successMessage))
        .catch((errorMessage) => {
            context.resolve(errorMessage);
        });
};
