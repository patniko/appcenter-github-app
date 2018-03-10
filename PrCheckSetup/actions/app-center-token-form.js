const path = require('path');
const fs = require('fs');
const token_setup_form_html = fs.readFileSync(path.resolve(__dirname, '../html/token-setup-form.html'), 'utf8');

module.exports = function (token) {
    return Promise.resolve(token_setup_form_html.replace('{0}', token));
};