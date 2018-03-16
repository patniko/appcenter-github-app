if (process.env['KEYVAULT_URI']) {
    module.exports = require('./keyvault');
} else {
    module.exports = require('./local');
}