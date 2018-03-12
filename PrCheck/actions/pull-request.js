
const path = require('path');
const fs = require('fs');
const appCenterRequests = require('../api/appcenter');
const githubRequests = require('../api/github');
const pem = fs.readFileSync(path.resolve(__dirname, '../appcenter.pem'));
const jwt = require('jsonwebtoken');
const pub = fs.readFileSync(path.resolve(__dirname, '../public.pem'));
const github_app_id = process.env['GITHUB_APP_ID'];
const app = githubRequests.createApp({
    id: github_app_id,
    cert: pem
});
const installationDao = require('../db/index').getAppInstallationsDao();

module.exports = function (request, log) {
    try {
        return app.getConfig(request.body.repository.owner.login, request.body.repository.name, request.body.installation.id).then((config) => {
            config = JSON.parse(Buffer.from(config.data.content, 'base64'));
            if (config.appcenter_apps && config.appcenter_apps.length) {
                let build_promises = [];
                for (let index = 0; index < config.appcenter_apps.length; index++) {
                    const repo_config = config.appcenter_apps[index];
                    build_promises.push(startRepoBuild(repo_config, request.body, log)
                        .catch((error) => {
                            log(error);
                        })
                    );
                }
                return new Promise((resolve, reject) => {
                    Promise.all(build_promises)
                        .then((...args) => {
                            if (args.length) {
                                resolve(args.join('; '));
                            }
                        }).catch((error) => {
                            reject(error);
                        });
                });
            } else {
                const head_repo = request.body.pull_request.head.repo.full_name;
                return Promise.resolve(`Webhook was triggered by ${head_repo}, but there is no such kind configuratio for this repo. Ignored.`);
            }
        });
    } catch (error) {
        Promise.reject(error);
    }
};

const startRepoBuild = function (repo_config, request_body, log) {
    const action = request_body.action;
    const branch = request_body.pull_request.head.ref;
    const sha = request_body.pull_request.head.sha;
    const target_branch = request_body.pull_request.base.ref;
    const pull_request = request_body.pull_request.id;
    const installation_id = request_body.installation.id;

    return new Promise((resolve, reject) => {
        let appcenter_token;
        installationDao.getAppCenterTokenFor(installation_id)
            .then((result) => {
                appcenter_token = result.app_center_token;
                if (!appcenter_token) {
                    reject('AppCenterToken could not be retrieved. Ignore.');
                }
                return new Promise((resolve, reject) => {
                    jwt.verify(appcenter_token, pub, { algorithms: ['RS256'] }, function (err, decoded) {
                        if (err) {
                            reject(err);
                        } else {
                            if (!decoded.token) {
                                reject('Could not decode token!');
                            } else {
                                appcenter_token = decoded.token;
                                appCenterRequests.getApp(decoded.token, repo_config.owner_name, repo_config.app_name).then(
                                    (appcenter_app) => { 
                                        resolve(appcenter_app); 
                                    }, (error) => { 
                                        reject(error); 
                                    });
                            }
                        }
                    });
                });
            }).then((appcenter_app) => {
                appcenter_app = JSON.parse(appcenter_app);
                let appcenter_owner_type;
                switch (appcenter_app.owner.type) {
                    case 'org': appcenter_owner_type = 'orgs'; break;
                    case 'user': appcenter_owner_type = 'users'; break;
                }
                const { branch_template, owner_name, app_name } = repo_config;
                const repo_path = request_body.pull_request.head.repo.full_name;
                const createEnvVariablesOn = function (branch_config) {
                    const env_variables_map =
                        [
                            ['PR_GITHUB_REPO', repo_path],
                            ['PR_APPCENTER_APP', `${appcenter_owner_type}/${owner_name}/${app_name}`],
                            ['PR_INSTALLATION_ID', installation_id]
                        ];
                    if (typeof (branch_config.environmentVariables) === 'undefined') {
                        branch_config.environmentVariables = [];
                        for (const env_var of env_variables_map) {
                            branch_config.environmentVariables.push({ 'name': env_var[0], 'value': env_var[1] });
                        }
                    } else {
                        for (const env_var of env_variables_map) {
                            if (!(branch_config.environmentVariables.some(elem => elem.name == env_var[0]))) {
                                branch_config.environmentVariables.push({ 'name': env_var[0], 'value': env_var[1] });
                            }
                        }
                    }
                    return branch_config;
                };
                if (action === 'opened' || action === 'synchronize') {
                    log(`PR #${pull_request} was ${action} on '${branch}' trying to merge into '${target_branch}'...`);
                    let new_branch_config = false;
                    appCenterRequests.getBuildConfiguration(branch, appcenter_token, owner_name, app_name).then((branch_config) => {
                        branch_config = JSON.parse(branch_config);
                        branch_config = createEnvVariablesOn(branch_config);
                        appCenterRequests.createPrCheckConfiguration(branch_config, branch, appcenter_token, owner_name, app_name);
                        return branch_config;
                    }, (error) => {
                        if (error.statusCode === 404) {
                            return appCenterRequests.getBuildConfiguration(branch_template, appcenter_token, owner_name, app_name)
                                .then(created_branch_config => {
                                    created_branch_config = JSON.parse(created_branch_config);
                                    new_branch_config = true;
                                    created_branch_config = createEnvVariablesOn(created_branch_config);
                                    return appCenterRequests.createPrCheckConfiguration(created_branch_config, branch, appcenter_token, owner_name, app_name);
                                }, (error) => {
                                    if (error.statusCode === 404) {
                                        return Promise.reject('Error: 404 Not Found. Please check you have pasted valid appcenter owner, owner type and app name in config.json.');
                                    } else if (error.statusCode == 401) {
                                        return Promise.reject('Error: 401 Unauthorized. Could not login to App Center. Please check you have pasted valid appcenter token in local.settings.json.');
                                    } else {
                                        return Promise.reject(error);
                                    }
                                });
                        } else if (error.statusCode == 401) {
                            return Promise.reject('Error: 401 Unauthorized. Could not login to AppCenter. Please check you have pasted valid appcenter token in local.settings.json.');
                        } else {
                            return Promise.reject(error);
                        }
                    }).then(() => {
                        return appCenterRequests.startPrCheck(branch, sha, appcenter_token, owner_name, app_name);
                    }).then((options) => {
                        options = JSON.parse(options);
                        return app.reportGithubStatus(
                            request_body.repository.full_name,
                            sha,
                            owner_name,
                            appcenter_owner_type,
                            app_name,
                            branch,
                            options.buildNumber,
                            installation_id,
                            app.status.PENDING
                        );
                    }).then(response => {
                        log(response);
                        resolve(`App Center app: "${app_name}". Started PR build for ${action} on ${new_branch_config ? 'existing' : 'new'} configuration...`);
                    }).catch((error) => {
                        reject(error);
                    });
                } else if (action === 'closed') {
                    log(`PR closed, deleting build configuration for ${branch}.`);
                    appCenterRequests.deletePrCheckConfiguration(branch, appcenter_token, owner_name, app_name)
                        .then(() => resolve(`${branch} has been removed.`))
                        .catch((error) => {
                            reject(error);
                        });
                } else {
                    log('Unsupported action detected.');
                    resolve(`${action} is an unsupported action. Ignored.`);
                }
            });
    });
};
