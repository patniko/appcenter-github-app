const DocumentDBClient = require('documentdb').DocumentClient;
const RunningBuildsDao = require('./models/running-builds-dao');
const AppInstallationsDao = require('./models/app-installations-dao');

const self = this;

module.exports = {
    getAppInstallationsDao: function() {
        if (!self.docDbClient) {
            self.docDbClient = new DocumentDBClient(process.env['DB_HOST'], {
                masterKey: process.env['DB_AUTH_KEY']
            });
        }
        if (!self.appInstallationsDao) {
            self.appInstallationsDao = new AppInstallationsDao(self.docDbClient, process.env['DB_ID'], 'AppInstallations');
            self.appInstallationsDao.init();
        }
        return self.appInstallationsDao;
    },
    getRunningBuildsDao: function () {
        if (!self.docDbClient) {
            self.docDbClient = new DocumentDBClient(process.env['DB_HOST'], {
                masterKey: process.env['DB_AUTH_KEY']
            });
        }
        if (!self.runningBuildsDao) {
            self.runningBuildsDao = new RunningBuildsDao(self.docDbClient, process.env['DB_ID'], 'RunningBuilds');
            self.runningBuildsDao.init();
        }
        return self.runningBuildsDao;
    },
};