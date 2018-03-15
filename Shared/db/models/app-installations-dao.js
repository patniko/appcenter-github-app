const docdbUtils = require('./doc-db-utils');
const trigger = require('../triggers/installation-id-trigger');

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const pub = fs.readFileSync(path.resolve(__dirname, '../../database-public.pem'));

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
        const self = this;
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

    //Gets id of the document with the specified installation id.
    getId: function (installationId) {
        const self = this;

        return new Promise((resolve, reject) => {
            const querySpec = {
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

    //Adds new installation to the database.
    addItem: function (item) {
        return new Promise((resolve, reject) => {
            const self = this;
            item.date = Date.now();
            
            //Required configuration to set unique constraint trigger on installation id.
            const options = { preTriggerInclude: 'installationIdTrigger' };
            self.client.createDocument(self.collection._self, item, options, function (err, doc) {
                if (err) {
                    if (err.substatus == 409) {
                        reject('There is already a document in a database with such an installation id. You may now leave this page.');
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(doc);
                }
            });
        });
    },

    //Removes information of the specified installation from the database.
    removeInstallation: function (installationId) {
        const self = this;
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

    //Gets document by its id.
    getItem: function (itemId) {
        const self = this;
        return new Promise((resolve, reject) => {
            const querySpec = {
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

    //Retrieves AppCenter token for the specified installation.
    getAppCenterTokenFor: function (installation_id) {
        const self = this;
        return new Promise((resolve, reject) => {
            const querySpec = {
                query: 'SELECT r.app_center_token FROM root r WHERE r.installation_id=@id',
                parameters: [{
                    name: '@id',
                    value: installation_id
                }]
            };
            try {
                self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
                    if (err) {
                        reject(err);
                    } else {
                        if (results.length) {
                            jwt.verify(results[0].app_center_token, pub, { algorithms: ['RS256'] }, function (err, decoded) {
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
                        } else {
                            reject(`installation_id=${installation_id} does not exist`);
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};
