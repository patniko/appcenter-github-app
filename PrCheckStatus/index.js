const appInstallationsDao = require('../Shared/db/index').getAppInstallationsDao();
const runningBuildsDao = require('../Shared/db/index').getRunningBuildsDao();
const appCenterRequests = require('../Shared/api/appcenter');
const githubRequests = require('../Shared/api/github');
const jwt = require('jsonwebtoken');

const fs = require('fs');
const path = require('path');
const github_app_id = process.env['GITHUB_APP_ID'];
const pub = fs.readFileSync(path.resolve(__dirname, '../Shared/database-public.pem'));
const pem = fs.readFileSync(path.resolve(__dirname, '../Shared/appcenter-github-app.pem'));
const app = githubRequests.createApp({
    id: github_app_id,
    cert: pem
});

module.exports = function (context) {
    runningBuildsDao.getAllBuilds()
        .then(running_builds => {
            let build_promises = [];
            for (const running_build of running_builds) {
                let appcenter_token;
                let build_completed = false;
                build_promises.push(appInstallationsDao.getAppCenterTokenFor(running_build.installation_id)
                    .then(result => {
                        return new Promise((resolve, reject) => {
                            jwt.verify(result.app_center_token, pub, { algorithms: ['RS256'] }, function (err, decoded) {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (!decoded.token) {
                                        reject('Could not decode token!');
                                    } else {
                                        resolve(decoded.token);
                                    }
                                }
                            });
                        });
                    }).then((decoded_appcenter_token) => {
                        appcenter_token = decoded_appcenter_token;
                        return appCenterRequests.getBuild(running_build.build_id, appcenter_token, running_build.appcenter_owner_name, running_build.appcenter_app_name);
                    }).then(build => {
                        build = JSON.parse(build);
                        let build_status = app.status.PENDING;
                        if (build.status === 'completed') {
                            build_completed = true;
                            switch (build.result) {
                                case 'succeeded': build_status = app.status.SUCCEEDED; break;
                                case 'failed': build_status = app.status.FAILED; break;
                            }
                            return app.reportGithubStatus(
                                running_build.repository_full_name,
                                build.sourceVersion,
                                running_build.appcenter_owner_name,
                                running_build.appcenter_owner_type,
                                running_build.appcenter_app_name,
                                build.sourceBranch,
                                build.id,
                                running_build.installation_id,
                                build_status
                            );
                        }
                        return Promise.resolve();
                    }).then(() => {
                        if (build_completed) {
                            return runningBuildsDao.removeRunningBuild(running_build.appcenter_owner_name, running_build.appcenter_app_name, running_build.build_id);
                        }
                        return Promise.resolve();
                    }).catch(error => context.log(error)));
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
        }).then(() => context.done()).catch((error) => {
            context.log(error);
            context.done();
        });
};