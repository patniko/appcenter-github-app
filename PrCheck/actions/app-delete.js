const appInstallationsDao = require('../db/index').getAppInstallationsDao();

module.exports = function (installation_id) {
    return new Promise((resolve, reject) => {
        appInstallationsDao.removeInstallation(installation_id, function (err, result) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};
