const DocDBUtils = {
    getOrCreateDatabase: function (client, databaseId, callback) {
        const querySpec = {
            query: 'SELECT * FROM root r WHERE r.id= @id',
            parameters: [{
                name: '@id',
                value: databaseId
            }]
        };
        client.queryDatabases(querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);
            } else {
                if (results.length === 0) {
                    const databaseSpec = {
                        id: databaseId
                    };
                    client.createDatabase(databaseSpec, function (err, created) {
                        callback(null, created);
                    });
                } else {
                    callback(null, results[0]);
                }
            }
        });
    },
    getOrCreateCollection: function (client, databaseLink, collectionId, callback) {
        const querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: collectionId
            }]
        };
        client.queryCollections(databaseLink, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);
            } else {
                if (results.length === 0) {
                    const collectionSpec = {
                        id: collectionId
                    };
                    client.createCollection(databaseLink, collectionSpec, function (err, created) {
                        callback(null, created);
                    });
                } else {
                    callback(null, results[0]);
                }
            }
        });
    }
};

module.exports = DocDBUtils;