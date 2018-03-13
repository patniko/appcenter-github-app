const appInstallationsDao = require('../db/index').getAppInstallationsDao();

module.exports = function (installation_id) {
    return appInstallationsDao.removeInstallation(installation_id);   
};
