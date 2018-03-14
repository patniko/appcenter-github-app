const docdbUtils = require('./doc-db-utils');

function AppInstallationsDao(documentDBClient, databaseId, collectionId) {
    this.client = documentDBClient;
    this.databaseId = databaseId;
    this.collectionId = collectionId;

    this.database = null;
    this.collection = null;
}

module.exports = AppInstallationsDao;

AppInstallationsDao.prototype = {
    init: function (callback) {
        var self = this;
        docdbUtils.getOrCreateDatabase(self.client, self.databaseId, function (err, db) {
            if (err) {
                callback(err);
            } else {
                self.database = db;
                docdbUtils.getOrCreateCollection(self.client, self.database._self, self.collectionId, function (err, coll) {
                    if (err) {
                        callback(err);
                    } else {
                        self.collection = coll;
                    }
                });
            }
        });
    },

    getId: function (installationId) {
        var self = this;

        return new Promise((resolve, reject) => {
            var querySpec = {
                query: 'SELECT r.id FROM root r WHERE r.installation_id=@id',
                parameters: [{
                    name: '@id',
                    value: installationId - 0
                }]
            };

            self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0]);
                }
            });
        });
    },

    removeInstallation: function (installationId) {
        var self = this;
        return new Promise((resolve, reject) => {
            self.getId(installationId).then((itemId) => {
                if (itemId) {
                    return self.getItem(itemId.id);
                } else {
                    resolve();
                }
            }).then((doc) => {
                if (doc) {
                    doc.completed = true;
                    self.client.deleteDocument(doc._self, function (err, replaced) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(replaced);
                        }
                    });
                } else {
                    resolve();
                }
            }).catch(err => {
                reject(err);
            });
        });
    },

    getItem: function (itemId) {
        var self = this;
        return new Promise((resolve, reject) => {
            var querySpec = {
                query: 'SELECT * FROM root r WHERE r.id = @id',
                parameters: [{
                    name: '@id',
                    value: itemId
                }]
            };
            self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0]);
                }
            });
        });
    },

    getAppCenterTokenFor: function (installation_id) {
        var self = this;
        return new Promise((resolve, reject) => {
            var querySpec = {
                query: 'SELECT r.app_center_token FROM root r WHERE r.installation_id=@id',
                parameters: [{
                    name: '@id',
                    value: installation_id
                }]
            };
            self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0]);
                }
            });
        });
    }
};