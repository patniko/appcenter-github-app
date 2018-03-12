const client_id =  process.env['GH_APP_CLIENT_ID'];
const client_secret = process.env['GH_APP_CLIENT_SECRET'];
const request = require('request-promise');

module.exports = {
    getIdentityRequestUrl: function(state, redirect_url) {
        return 'https://github.com/login/oauth/authorize' + 
            `?client_id=${client_id}&redirect_url=${redirect_url}` + 
            `&scope=user&state=${state}&allow_signup=false`;
    },
    getAccessToken: function(state, code, redirect_url) {
        const location = 'https://github.com/login/oauth/access_token' +
            `?client_id=${client_id}&client_secret=${client_secret}` +
            `&code=${code}&state=${state}&redirect_url=${redirect_url}`;
        const options = {
            url: location,
            method: 'POST'
        };
        return request(options);
    },
    getUserApps: function(token) {
        const options = {
            url: `https://api.github.com/user/installations?access_token=${token}`,
            method: 'GET',
            headers: { 
                'Accept': 'application/vnd.github.machine-man-preview+json', 
                'Content-Type': 'application/json',
                'User-Agent': 'node.js'
            }
        };
        return request(options);
    }
};