const path = require('path');
const fs = require('fs');
const identity_redirect_html = fs.readFileSync(path.resolve(__dirname, '../html/redirect-script.html'), 'utf8');

module.exports = function (location) {
    return Promise.resolve(identity_redirect_html.replace('{0}', location));
};