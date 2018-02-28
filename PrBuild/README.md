# Getting Started
1. Install the latest Azure Functions CLI on your system. 
 
```npm install -g azure-functions-core-tools@core ```
 
2. Update _APP_CENTER_TOKEN_ in `local.settings.json` with a valid [App Center API token](https://appcenter.ms/settings/apitokens).

3. Update _GITHUB_TOKEN_ in `local.settings.json` with a valid [Github token](https://github.com/settings/tokens).

4. Update the `config.json` file in th PrBuild folder.

5. Run the Azure Function locally to verify releases are being processed correctly.

```func host start –-debug vscode```

6. Commit the changes to your fork.

7. Link the project to your subscription before running by navigating to the Azure portal, creating a new Function called PrBuild underneath a subscription and running the command below to link the two.

```func azure functionapp fetch-app-settings PrBuild ```

8. Configure a webhook under `https://github.com/<repo_owner>/<repo_name>/settings/hooks` with an url from the Azure portal. You can find it pressing `Get function url` button in the right corner at the top of the function code.

9. Put `appcenter-post-build.sh` in the location as specified [here](https://docs.microsoft.com/en-us/appcenter/build/custom/scripts/).

10. Create a PR in your repo: when all the builds finish, you will see the updated status(es) in your PR saying whether the build(s) succeeded.
