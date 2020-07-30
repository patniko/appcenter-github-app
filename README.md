<a href="https://githubexpertsapi.azurewebsites.net/site/scheduler/patniko/appcenter-github-app">Schedule time with an Expert!</a>

# Developer getting started

1. Install the latest Azure Functions CLI on your system.

    ```npm install -g azure-functions-core-tools@core```

1. Create a CosmosDB database in Azure Portal and update `local.settings.json` with valid `DB_ID`, `DB_HOST` and `DB_AUTH_KEY` values.

1. Link the project to your subscription before running by navigating to the Azure portal, creating three functions called PrCheck, PrCheckSetup and PrCheckStatus underneath a subscription and running the command below to link the two. Note that the PrCheck function should be *private*.

    ```func azure functionapp fetch-app-settings AppCenterFunctions```

    >Note: If you get the message `Can't find app with name "AppCenterFunctions" in current subscription`, simply do the following:

    - Run `func azure account list`
    - Find an id of the MS_INT subscription
    - Run `func azure account set <sub_id>`

1. Create a GitHub app and configure webhook url to point to `PrCheck` function and Setup Url, authorization callback url to point to `PrCheckSetup` function.
Under "Permissions and Webhooks" section, give access to "Repository metadata", "Commit statuses", "Pull requests" and "Repository contents". Subscribe to "Pull request" and "Delete" event.

1. When you create an app on GitHub, you will be prompted to generate a private key for it. Download it and put it under `Shared` folder named as `appcenter-github-app.pem`.

1. Provide a `GITHUB_APP_ID`, `GH_APP_CLIENT_ID` and `GH_APP_CLIENT_SECRET` in local settings as it is available now.

1. Next, generate a public/private rsa keypair for encoding data stored in the database. This is done via `openssl genrsa -out database-private.pem` and `openssl rsa -in database-private.pem -pubout -out database-public.pem`. 

1. Put a `database-public.pem` and `database-private.pem` under `Shared` folder.

1. Run `npm i` from `Shared` folder.

1. Now run the Azure Function locally to verify releases are being processed correctly. You can specify the names of the functions that need to be run in `host.json` file.
    ```func host start –-debug vscode```

    `host.json`:
    ```json
    {
        "functions": [ "PrCheck", "PrCheckSetup", "PrCheckStatus" ],
        "watchDirectories": ["Shared"]
    }
    ```
    - If you want to debug the function locally, use `ngrok`. 
    - Start the debugger, then execute `ngrok http 7071`. Copy the link from the console - you can now use it to construct webhook and setup urls. Just add the `api/PrCheck` or `api/PrCheckSetup` to the ngrok url.
    - To attach to the debugger, use `F5`.

1. Publish the changes to the Azure portal using `func azure functionapp publish AppCenterFunctions publish -i`.

## KeyVault (almost done)

Now all credential files are stored in sources and that is potential security problem. To avoid it we can store all of credentials in [Azure KeyVault](https://azure.microsoft.com/en-us/services/key-vault/) storage. Azure has [MSI](https://docs.microsoft.com/en-us/azure/active-directory/managed-service-identity/overview) feature which provide ability for Azure service to call another deployed Azure service using local authetication mechanism.

### Setup
1. Move all `.pem` files to KeyVault:
    1. Create new KeyVault storage in portal.azure.com and open it.
    2. Create new secret (`Secret->Generate/Import`) using this settings:
        * **Upload options**:  Manual
        * **Name**: appcenter-githup-app
        * **Value**: _(copy-paste here content of `appcenter-githup-app.pem`)_
        * **Enabled**: Yes
    3. Repeat step 1.2 for `database-public.pem`, `database-private.pem` (remove `.pem` and use it for `Name` option).
2. Grant `AppCenterFunctions` app access to KeyVault:
    1. Open `Access Policies`.
    2. Click `Add new`.
    3. Click `Select Principal` and choose `AppCenterFunctions` app.
    4. Click `Secret Permissions` and select `Get` under the `Secret Management Operations`.
    5. Click `Ok`.
3. Enable MSI for `AppCenterFunctions` app:
    1. Click `Function Apps->AppCenterFunctions->Platform Features`.
    3. Select `Managed Service Identity`.
    2. Select `On` for `Register with Azure Active Directory` and return back.
    3. Click on `Development Tools->Console`.
    4. Enter `set` command in console and make sure there are two non-empty environment variables `MSI_ENDPOINT` and `MSI_SECRET`.
4. *Configure `AppCenterFunctions` to use credentials from KeyVault (**in case if [TODO](#keyvault-todo) section has been already done**):
    1. Click `Application Settings` and set these four environment variables:
        * **KEYVAULT_URI** - this is public URI for KeyVault has already generated at 1.1 step. You can find here: `Home-><your-key-vault-storage>->Overview->DNS Name`.
        * **APPCENTER_GITHUB_APP_KEY_VERSION**, **DATABASE_PUBLIC_KEY_VERSION**, **DATABASE_PRIVATE_KEY_VERSION** - these are secret version value for each of `appcenter-githup-app`, `database-public`, `database-private` respectively. You can find them here: 
            * Open `Home-><your-key-vault-storage>->Secrets-><your-secret>-><select-secret-version>` and use the last part of `Secret Identifier` value as it. For example if `Secret Identifier` value is `https://mykeyvault.vault.azure.net/secrets/appcenter-githup-app/14dae147577e4916b8de3105159ffa95`, then secret value is `14dae147577e4916b8de3105159ffa95`.

**NOTE:** If you don't want to use KeyVault, just don't set **KEYVAULT_URI** env variable for `AppCenterFunctions` app and it will be using local credentials files as it did before.

### KeyVault TODO
Those changes should be done in code to finally add KeyVault support:

1. Replace all reads from local files for credentials like this

```js
const pem = fs.readFileSync(path.resolve(__dirname, '../../Shared/appcenter-github-app.pem'));
```

with respective methods calls from `credentials` package:

```js
const credentials = require('../correct/related/path/Shared/credentials');
credentials.getAppcenterGithubApp().then((key) => {
    ...
}).catch((error) => {
    ...
})
```

Note that these methods return promises!

# User getting started

1. Install the github application following the link.

2. Choose those repositories that you wish to use the application in.

3. You will be redirected to the setup page, where you should authorize github, then you will be redirected to another page and prompted to enter the AppCenter token. Enter the token and save it. You will be redirected to the application page after the token is saved. In the future, this is where you can add more repositories.

4. Put `appcenter-pr.json` in the root of your project, keeping the structure as follows and filling the fields with the respective AppCenter applications and your AppCenter username:
    ```json
    {
        "appcenter_apps": [
            {
                "branch_template": "master",
                "owner_name": "appcenter.owner",
                "app_name": "appname-ios"
            },
            {
                "branch_template": "master",
                "owner_name": "appcenter.owner",
                "app_name": "appname-android"
            }
        ]
    }
    ```
5. Commit those changes to your repo.

6. Create a PR in your repo: when all the builds finish, you will see the updated status(es) in the PR saying whether the build(s) succeeded. To see the repsective builds in AppCenter, click on "Details".



# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
