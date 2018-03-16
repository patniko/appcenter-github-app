const fs = require('fs');
const path = require('path');

const APPCENTER_GITHUB_APP_KEY = 'appcenter-github-app.pem';
const DATABASE_PUBLIC_KEY = 'database-public.pem';
const DATABASE_PRIVATE_KEY = 'database-private.pem';

const readCredentialFromFile = (fileName) => {
    try {
        const filePath = path.resolve(__dirname, '..', fileName);
        if (!fs.existsSync(filePath)) {
            return Promise.reject(new Error(`File ${filePath} does not exist.`));
        }
        const content = fs.readFileSync(filePath);
        return Promise.resolve(content);
    } catch (e) {
        return Promise.reject(e);
    }
};

module.exports = {
    getAppcenterGithubAppKey: () => {
        return readCredentialFromFile(APPCENTER_GITHUB_APP_KEY);
    },
    getDatabasePublicKey: () => {
        return readCredentialFromFile(DATABASE_PUBLIC_KEY);
    },
    getDatabasePrivateKey: () => {
        return readCredentialFromFile(DATABASE_PRIVATE_KEY);
    },
}