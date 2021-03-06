module.exports = {
    uniqueConstraintTrigger: function () {
        return {
            id: 'installationIdTrigger',
            serverScript: function uniqueConstraint() {
                const UNIQUE_PROPERTY_NAME = 'installation_id';

                const ERROR_CODE = {
                    BAD_REQUEST: 400,
                    NOT_FOUND: 404,
                    CONFLICT: 409,
                    NOT_ACCEPTED: 499
                };

                const OPERATION_TYPE = {
                    create: 'Create',
                    upsert: 'Upsert',
                    replace: 'Replace',
                    delete: 'Delete',
                };

                let operationType = __.request.getOperationType();
                let docFromRequest = __.request.getBody();

                switch (operationType) {
                    case OPERATION_TYPE.create: onCreate(); break;
                    case OPERATION_TYPE.upsert: onUpsert(); break;
                    case OPERATION_TYPE.replace: onReplace(); break;
                    case OPERATION_TYPE.delete: onDelete(); break;
                    default: throw new Error(ERROR_CODE.BAD_REQUEST, 'Unsupported operation type: ' + operationType);
                }

                function onCreate() {
                    insertMetaDoc();
                }

                function onDelete() {
                    // Since there can be only one non-meta doc with unique field, there are no other non-meta docs that share same id.
                    // Thus, when non-meta doc is deleted, we need delete the metaDoc.
                    let metaDocLink = __.getAltLink() + '/docs/' + generateUniqueIdValue(docFromRequest, UNIQUE_PROPERTY_NAME);

                    let isAccepted = __.deleteDocument(metaDocLink, {}, function (err, options) {
                        if (err) throw new Error(err.number, 'Failed to delete meta document via link ' + err.message);
                    });
                    checkAccepted(isAccepted);
                }

                function onReplace() {  // NOTE: this must run as pre-trigger.
                    // Replace may change original doc id, thus we can't use id of the doc from request to get the resource. Use _self.
                    // Since there can be only one non-meta doc with unique field, there are no other non-meta docs that share same id.
                    // Replace the metaDoc, if needed.
                    if (!docFromRequest._self) throw new Error(ERROR_CODE.BAD_REQUEST, '__.request.getBody()._self must be provided by the system.');

                    let isAccepted = __.readDocument(docFromRequest._self, {}, function (err, oldDoc, options) {
                        if (err) throw err;
                        if (oldDoc[UNIQUE_PROPERTY_NAME] !== docFromRequest[UNIQUE_PROPERTY_NAME]) {
                            replaceMetaDocId(oldDoc);
                        }
                    });
                    checkAccepted(isAccepted);
                }

                function onUpsert() { // Note: this must run as pre-trigger (would not work as post-trigger).
                    // Since upsert is using the 'id' field to identify the resource, the logic is:
                    // If the document obtained by id does not exist, insert the meta doc.
                    // Else replace meta-doc, if needed.
                    if (!docFromRequest.id) insertMetaDoc();
                    else {
                        let docLink = __.getAltLink() + '/docs/' + docFromRequest.id;
                        let isAccepted = __.readDocument(docLink, {}, function (err, oldDoc, options) {
                            if (err) {
                                if (err.number == ERROR_CODE.NOT_FOUND) insertMetaDoc();
                                else throw err;
                            } else if (oldDoc[UNIQUE_PROPERTY_NAME] !== docFromRequest[UNIQUE_PROPERTY_NAME]) {
                                replaceMetaDocId(oldDoc);
                            }
                        });
                        checkAccepted(isAccepted);
                    }
                }

                function insertMetaDoc() {
                    let metaDoc = { id: generateUniqueIdValue(docFromRequest, UNIQUE_PROPERTY_NAME), isMetadata: true };

                    // This will result in ERROR_CODE.CONFLICT if there is another doc with this id already.
                    let isAccepted = __.createDocument(__.getSelfLink(), metaDoc, {}, function (err, body, options) {
                        if (err) {
                            if (err.number == ERROR_CODE.CONFLICT) throw new Error(err.number, 'Unique constraint for property ' + UNIQUE_PROPERTY_NAME + ' failed: (' + err.number + '): ' + err.message);
                            else throw err;
                        }
                    });
                    checkAccepted(isAccepted);
                }

                function replaceMetaDocId(oldDoc) {
                    let metaDocLink = __.getAltLink() + '/docs/' + generateUniqueIdValue(oldDoc, UNIQUE_PROPERTY_NAME);
                    let isAccepted = __.readDocument(metaDocLink, {}, function (err, metaDoc, options) {
                        if (err) throw new Error(err.number, 'Failed to read meta document via link  + metaDocLink + ' + err.message);

                        // Change to new id.
                        metaDoc.id = generateUniqueIdValue(docFromRequest, UNIQUE_PROPERTY_NAME);

                        let isAccepted = __.replaceDocument(metaDocLink, metaDoc, function (err, doc, options) {
                            if (err) throw new Error(err.number, 'Failed to replace meta document via link  + metaDocLink + ' + err.message);
                            // Note: the error could be due to snapshot isolation (HTTP error 449), the client needs to check that and and retry the operation.
                        });
                        checkAccepted(isAccepted);
                    });
                    checkAccepted(isAccepted);
                }

                function generateUniqueIdValue(doc, uniquePropertyName) {
                    return '__uniqueConstraint_' + uniquePropertyName + '_' + doc[uniquePropertyName];
                }

                function checkAccepted(isAccepted) {
                    if (!isAccepted) throw new Error(errorCodes.NOT_ACCEPTED, 'The request was not accepted. Retry from the client.');
                }
            },
            triggerType: 'Pre',
            triggerOperation: 'Create'
        };
    }
};