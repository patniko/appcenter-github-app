const docdbUtils = require('./doc-db-utils');
const trigger = require('../triggers/installation-id-trigger');

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
                        self.client.createTrigger(self.collection._self, trigger.uniqueConstraintTrigger(), {}, () => {});
                    }
                });
            }
        });
    },

    addItem: function (item) {
        return new Promise((resolve, reject) => {
            var self = this;
            item.date = Date.now();
            var options = { preTriggerInclude: "installationIdTrigger" };
            self.client.createDocument(self.collection._self, item, options, function (err, doc) {
                if (err) {
                    if (err.substatus == 409) {
                        reject("There is already a document in a database with such an installation id. You may now leave this page.");
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(doc);
                }
            });
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
    },
    // TODO: remove Item
};