const appDelete = require('./actions/app-delete');
const pullRequest = require('./actions/pull-request');

const processWebhookRequest = function (request) {
    if (request.body && (request.body.action || request.body.ref)) {
        if (request.body.installation && (request.body.action == 'created' || request.body.action == 'deleted')) {
            switch (request.body.action) {
                case 'created': return Promise.resolve('Installing App Center GitHub app...');
                case 'deleted': return appDelete(request.body.installation.id);
            }
        } else if ((request.body.ref && request.body.ref_type === 'branch') || (request.body.pull_request && (request.body.action === 'opened' || request.body.action === 'reopened' || request.body.action === 'synchronize' || request.body.action === 'closed'))) {
            return pullRequest(request, log);
        } else {
            return Promise.reject('Unsupported action.');
        }
    }
    return Promise.reject('Please post a valid webhook payload.');
};

let log = function () { };

const resolveContext = function (body, status) {
    this.res = { body: body, status: status };
    this.done();
};

module.exports = function (context, request) {
    context.resolve = resolveContext;
    log = context.log;
    processWebhookRequest(request)
        .then(successMessage => context.resolve(successMessage))
        .catch((errorMessage) => {
            context.resolve(errorMessage, 400);
        });
};