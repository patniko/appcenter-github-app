
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
