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
        //Redirect to GitHub authorization.
        const location = github.getIdentityRequestUrl(request.query.installation_id, request.headers.host + '/' + request.url);
        return identityRedirectScript(location);
    } else if (request.body) {
        //User entered the AppCenter token on our page and sent it back via POST.
        //To verify that this is not just a random user, we include github token value in this post request.
        const params = request.body.split('&');
        let gh_token;
        let token;
        let state;
        for (let i = 0; i < params.length; i++) {
            if (params[i].startsWith('ghtoken')) {
                gh_token = params[i].split('=')[1];
            }
            if (params[i].startsWith('token')) {
                token = params[i].split('=')[1];
            }
            if (params[i].startsWith('state')) {
                state = params[i].split('=')[1];
            }
        }
        if (!gh_token || !token || !state) {
            Promise.resolve('Could not manage to store the token. The information sent is not valid.');
        }
        //Base64 decoding.
        gh_token = atob(gh_token);
        token = atob(token);
        return new Promise((resolve, reject) => {
            let apps;
            //Using the github token, retrieving the list of all installed GitHub apps for this user. 
            //Then find the app with our id and use it further.
            github.getUserApps(gh_token).then((applications) => {
                apps = applications;
                return github.getCurrentUser(gh_token);
            }).then((account) => {
                account = JSON.parse(account);
                let accountId = account.id;
                apps = JSON.parse(apps);
                let github_app_installation;
                if (apps.installations && apps.installations.length) {
                    const github_app_id = process.env['GITHUB_APP_ID'];
                    github_app_installation = apps.installations.filter((installation) => {
                        return installation.app_id == github_app_id && installation.id == state && installation.account.id == accountId;
                    })[0];
                }
                if (!github_app_installation || !github_app_installation.id) {
                    reject('Could not manage to store the token. No installations of our app found on this account.');
                }
                //Encode token in RSA before putting it to database.
                const encoded_appcenter_token = jwt.sign({ token: token }, pem, { algorithm: 'RS256' });
                const item = {
                    installation_id: github_app_installation.id,
                    app_center_token: encoded_appcenter_token
                };
                appInstallationsDao.addItem(item).then(() => {
                    //If the AppCenter token is successfully stored, send the GitHub app installation id back to setup page.
                    resolve('installation=' + github_app_installation.id);
                }).catch((err) => {
                    reject('Could not manage to store the token. ' + err || err.message || err.body);
                });
            }, (error) => {
                reject('Could not manage to store the token. Not valid github token sent.' + error || error.message);
            });
        });
    } else if (request.query.code && request.query.state) {
        //2nd stage of Oauth2. Retrieving the github token.
        return github.getAccessToken(request.query.state, request.query.code, request.headers.host + '/' + request.url)
            .then((response) => {
                const responses = response.split('&');
                const token = responses.find(elem => elem.startsWith('access_token')).split('=')[1];
                //When the github token is retrieved, we can safely send a setup page back to user. 
                //It has the github token hidden in it.
                return appCenterTokenForm(btoa(token), request.query.state);
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
