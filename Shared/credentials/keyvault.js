const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');

const APPCENTER_GITHUB_APP_KEY = 'appcenter-github-app';
const DATABASE_PUBLIC_KEY = 'database-public';
const DATABASE_PRIVATE_KEY = 'database-private';

const checkLocalEnv = (variable) => {
    if (!process.env[variable]) {
        throw new Error(`${variable} variable doesn't set in local.settings.json.`);
    }
}

const fixRsaHeaders = (pem, beginHeader, endHeader) => {
    if (pem.indexOf(beginHeader) >= 0) {
        pem = pem
            .replace(beginHeader, '')
            .replace(endHeader, '')
            .replace(/\s/g, '\n');
        pem = beginHeader + pem;
        pem += endHeader;
    }
    return pem;
};

const readCredentialFromKeyVault = (keyName, keyVersionVar) => {
    let client, keyVaultUri, keyVersion;
    try {
        keyVaultUri = process.env['KEYVAULT_URI'];

        checkLocalEnv(keyVersionVar);
        keyVersion = process.env[keyVersionVar];

        // TODO It can be optimized by saving in closure
        const creds = new msRestAzure.MSIAppServiceTokenCredentials({ resource: "https://vault.azure.net" });
        client = new KeyVault.KeyVaultClient(creds);
    } catch (e) {
        return Promise.reject(e);
    }

    return client.getSecret(keyVaultUri, keyName, keyVersion)
        .then((secret) => {
            let value = secret.value;
            value = fixRsaHeaders(value, '-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----');
            value = fixRsaHeaders(value, '-----BEGIN PUBLIC KEY-----', '-----END PUBLIC KEY-----');
            return value;
        });
};

module.exports = {
    getAppcenterGithubAppKey: () => {
        return readCredentialFromKeyVault(APPCENTER_GITHUB_APP_KEY, "APPCENTER_GITHUB_APP_KEY_VERSION");
    },
    getDatabasePublicKey: () => {
        return readCredentialFromKeyVault(DATABASE_PUBLIC_KEY, "DATABASE_PUBLIC_KEY_VERSION");
    },
    getDatabasePrivateKey: () => {
        return readCredentialFromKeyVault(DATABASE_PRIVATE_KEY, "DATABASE_PRIVATE_KEY_VERSION");
    }
}