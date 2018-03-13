
# Getting started

1. Install the latest Azure Functions CLI on your system. 
 
```npm install -g azure-functions-core-tools@core ```
 
2. Create a database in Azure Portal and update `local.settings.json` with valid `DB_ID`, `DB_HOST` and `DB_AUTH_KEY` values.

3. Run the Azure Function locally to verify releases are being processed correctly. You can specify the names of the functions that need to be run, in `host.json` file.

```func host start –-debug vscode```

`host.json`:
```
{
    "functions": [ "PrCheck", "PrCheckSetup" ]
}
```
   - If you want to debug the function locally, use `ngrok`. 
   - Start the debugger, then execute `ngrok http 7071`. Copy the link from the console - you can now use it to construct webhook and setup urls.  
   - To attach to the debugger, use `F5`.

5. Link the project to your subscription before running by navigating to the Azure portal, creating a new Function called PrCheck underneath a subscription and running the command below to link the two.

```func azure functionapp fetch-app-settings AppCenterFunctions ```

>Note: If you get the message `Can't find app with name "AppCenterFunctions" in current subscription`, simply do the following:
- Run `func azure account list`
- Find an id of the MS_INT subscription
- Run `func azure account set <sub_id>`

6. Create a GitHub app and configure webhook url to point to `PrCheck` function and Setup Url, authorization callback url to point to `PrCheckSetup` function. 

7. When you create an app on GitHub, you will be prompted to generate a private key for it. Download it and put it under `PrCheck` folder named as `appcenter.pem`.

8. Provide a `GITHUB_APP_ID`, `GH_APP_CLIENT_ID` and `GH_APP_CLIENT_SECRET` in local settings as it is available now.

9. Next, generate a public/private rsa keypair for encoding data stored in the database. This is done via `openssl genrsa -out database-private.pem` and `openssl rsa -in database-private.pem -pubout -out database-public.pem`. 

10. Put a `database-public.pem` under `PrCheck` folder and `database-private.pem` under `PrCheckSetup` folder.

12. Publish the changes to the Azure portal using `func azure functionapp publish AppCenterFunctions publish -i`.

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
