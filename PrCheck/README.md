# Getting Started
1. Make sure you have followed the general instruction on how to use the github app.

2. Put `appcenter-post-build.sh` in the location as specified [here](https://docs.microsoft.com/en-us/appcenter/build/custom/scripts/).

3. Put `appcenter-pr.json` in the root of your project, keeping the structure as follows: 

```
{
    "repos": [
        {
            "provider": "github",
            "repo_owner": "repo-owner",
            "repo_name": "repo-name",
            "branch_template": "master",
            "appcenter_owner_type": "users",
            "appcenter_owner": "appcenter.owner",
            "appcenter_app": "appname-ios"
        },
        {
            "provider": "github",
            "repo_owner": "repo-owner",
            "repo_name": "repo-name",
            "branch_template": "master",
            "appcenter_owner_type": "users",
            "appcenter_owner": "appcenter.owner",
            "appcenter_app": "appname-android"
        }
    ]
}
```

3. Create a PR in your repo: when all the builds finish, you will see the updated status(es) in your PR saying whether the build(s) succeeded.
