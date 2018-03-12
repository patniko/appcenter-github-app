# Getting Started
1. Install the github application following the link.

2. Choose those repositories that you wish to use the application in.

3. You will be redirected to the setup page, where you should authorize github, then you will be redirected to another page and prompted to enter the AppCenter token. Enter the token and save it. You will be redirected to the application page after the token is saved. In the future, this is where you can add more repositories.

4. Put `appcenter-post-build.sh` in the location of your project as specified [here](https://docs.microsoft.com/en-us/appcenter/build/custom/scripts/).

5. Put `prcheck_config.json` in the root of your project, keeping the structure as follows and filling the fields with the respective AppCenter applications and your AppCenter username: 

```
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

6. Commit those changes to your repo.

7. Create a PR in your repo: when all the builds finish, you will see the updated status(es) in the PR saying whether the build(s) succeeded. To see the repsective builds in AppCenter, click on "Details".
