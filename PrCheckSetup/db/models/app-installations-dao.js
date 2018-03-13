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

    find: function (querySpec, callback) {
        var self = this;

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);

            } else {
                callback(null, results);
            }
        });
    },

    addItem: function (item) {
        return new Promise((resolve, reject) => {
            var self = this;
            item.date = Date.now();
            self.client.createDocument(self.collection._self, item, function (err, doc) {
                if (err) {
                    reject(err);

                } else {
                    resolve(doc);
                }
            });
        });
    },

    updateToken: function (itemId, token, callback) {
        var self = this;

        self.getItem(itemId, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                doc.app_center_token = token;
                self.client.replaceDocument(doc._self, doc, function (err, replaced) {
                    if (err) {
                        callback(err);

                    } else {
                        callback(null, replaced);
                    }
                });
            }
        });
    },

    getId: function (installationId, callback) {
        var self = this;

        var querySpec = {
            query: 'SELECT r.id FROM root r WHERE r.installation_id=@id',
            parameters: [{
                name: '@id',
                value: installationId - 0
            }]
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);
            } else {
                callback(null, results[0]);
            }
        });
    },

    getItem: function (itemId, callback) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id = @id',
            parameters: [{
                name: '@id',
                value: itemId
            }]
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);

            } else {
                callback(null, results[0]);
            }
        });
    },

    setAppCenterTokenFor: function (installationId, token, callback) {
        var self = this;
        self.getId(installationId, function (err, result) {
            if (!err) {
                if (!result) {
                    callback("No record in the database with such an installation id.");
                } else {
                    self.updateToken(result.id, token, function (err, result) {
                        if (err) { callback(err); } else {
                            callback(null, result);
                        }
                    });
                }
            } else {
                callback(err);
            }
        }
        );
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