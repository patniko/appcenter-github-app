# Getting Started
1. Install the latest Azure Functions CLI on your system. 
 
```npm install -g azure-functions-core-tools@core ```
 
2. Link the project to your subscription before running by navigating to the Azure portal, creating a new Function called PrBuild underneath a subscription and running the command below to link the two.

```func azure functionapp fetch-app-settings PrBuild ```

3. Update _APP_CENTER_TOKEN_ in `local.settings.json` with a valid [App Center API token](https://appcenter.ms/settings/apitokens).

4. Update the `config.json` file in the PrBuild folder.

5. Run the Azure Function locally to verify releases are being processed correctly.

```func host start –-debug vscode```
