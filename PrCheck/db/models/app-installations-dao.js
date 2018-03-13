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

    addItem: function (item, callback) {
        var self = this;
        item.date = Date.now();
        self.client.createDocument(self.collection._self, item, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(null, doc);
            }
        });
    },

    updateItem: function (itemId, callback) {
        var self = this;

        self.getItem(itemId, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                doc.completed = true;
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

    removeInstallation: function (installationId, callback) {
        var self = this;
        self.getId(installationId, function(err, itemId) {
            if (!err) {
                if (itemId) {
                    self.getItem(itemId.id, function (err, doc) {
                        if (err) {
                            callback(err);
                        } else if (doc) {
                            doc.completed = true;
                            self.client.deleteDocument(doc._self, function (err, replaced) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, replaced);
                                }
                            });
                        }
                    });
                }
            } else {
                callback(err);
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