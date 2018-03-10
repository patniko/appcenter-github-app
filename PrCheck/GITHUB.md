Needs:
1. Convert Github pending status update to use octokit client.
2. Look into a better config.json approach.
2a. Option 1 is to have a file in the source repo that contains the config
2b. Create a very basic UI to set the config and store it in CosmosDB.



Github App Flow:

1) User adds App Center Github app. 
2) Github punches out to https://appcenterfunctions.azurewebsites.net/api/PrCheck?installation_id=96957
3) Setup on end => we would store in the CosmosDB in the future.
4) The PR webhook should now fire automatically for this user.

5) User opens PR.
6) We get sent webhook.
7) We process config.json 
8) Return status to Github => should use octokit client for this instead of curl => leave this for the future

9) User uninstall Github app. Nothing should happen if we aren't using CosmosDB.


// Install Event
{
  "action": "created",
  "installation": {
    "id": 96957,
    "account": {
      "login": "pniko",
      "id": 26906478,
      "avatar_url": "https://avatars3.githubusercontent.com/u/26906478?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/pniko",
      "html_url": "https://github.com/pniko",
      "followers_url": "https://api.github.com/users/pniko/followers",
      "following_url": "https://api.github.com/users/pniko/following{/other_user}",
      "gists_url": "https://api.github.com/users/pniko/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/pniko/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/pniko/subscriptions",
      "organizations_url": "https://api.github.com/users/pniko/orgs",
      "repos_url": "https://api.github.com/users/pniko/repos",
      "events_url": "https://api.github.com/users/pniko/events{/privacy}",
      "received_events_url": "https://api.github.com/users/pniko/received_events",
      "type": "User",
      "site_admin": false
    },
    "repository_selection": "selected",
    "access_tokens_url": "https://api.github.com/installations/96957/access_tokens",
    "repositories_url": "https://api.github.com/installation/repositories",
    "html_url": "https://github.com/settings/installations/96957",
    "app_id": 9631,
    "target_id": 26906478,
    "target_type": "User",
    "permissions": {
      "statuses": "write",
      "metadata": "read",
      "pull_requests": "read"
    },
    "events": [
      "pull_request",
      "pull_request_review",
      "pull_request_review_comment",
      "status"
    ],
    "created_at": 1519959446,
    "updated_at": 1519959446,
    "single_file_name": null
  },
  "repositories": [
    {
      "id": 117189564,
      "name": "detox-appcenter",
      "full_name": "pniko/detox-appcenter"
    }
  ],
  "sender": {
    "login": "pniko",
    "id": 26906478,
    "avatar_url": "https://avatars3.githubusercontent.com/u/26906478?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/pniko",
    "html_url": "https://github.com/pniko",
    "followers_url": "https://api.github.com/users/pniko/followers",
    "following_url": "https://api.github.com/users/pniko/following{/other_user}",
    "gists_url": "https://api.github.com/users/pniko/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/pniko/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/pniko/subscriptions",
    "organizations_url": "https://api.github.com/users/pniko/orgs",
    "repos_url": "https://api.github.com/users/pniko/repos",
    "events_url": "https://api.github.com/users/pniko/events{/privacy}",
    "received_events_url": "https://api.github.com/users/pniko/received_events",
    "type": "User",
    "site_admin": false
  }
}








6) User uninstall extension
{
  "action": "deleted",
  "installation": {
    "id": 96957,
    "account": {
      "login": "pniko",
      "id": 26906478,
      "avatar_url": "https://avatars3.githubusercontent.com/u/26906478?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/pniko",
      "html_url": "https://github.com/pniko",
      "followers_url": "https://api.github.com/users/pniko/followers",
      "following_url": "https://api.github.com/users/pniko/following{/other_user}",
      "gists_url": "https://api.github.com/users/pniko/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/pniko/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/pniko/subscriptions",
      "organizations_url": "https://api.github.com/users/pniko/orgs",
      "repos_url": "https://api.github.com/users/pniko/repos",
      "events_url": "https://api.github.com/users/pniko/events{/privacy}",
      "received_events_url": "https://api.github.com/users/pniko/received_events",
      "type": "User",
      "site_admin": false
    },
    "repository_selection": "selected",
    "access_tokens_url": "https://api.github.com/installations/96957/access_tokens",
    "repositories_url": "https://api.github.com/installation/repositories",
    "html_url": "https://github.com/settings/installations/96957",
    "app_id": 9631,
    "target_id": 26906478,
    "target_type": "User",
    "permissions": {
      "statuses": "write",
      "metadata": "read",
      "pull_requests": "read"
    },
    "events": [
      "pull_request",
      "pull_request_review",
      "pull_request_review_comment",
      "status"
    ],
    "created_at": "2018-03-02T02:57:26Z",
    "updated_at": "2018-03-02T02:57:26Z",
    "single_file_name": null
  },
  "sender": {
    "login": "pniko",
    "id": 26906478,
    "avatar_url": "https://avatars3.githubusercontent.com/u/26906478?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/pniko",
    "html_url": "https://github.com/pniko",
    "followers_url": "https://api.github.com/users/pniko/followers",
    "following_url": "https://api.github.com/users/pniko/following{/other_user}",
    "gists_url": "https://api.github.com/users/pniko/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/pniko/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/pniko/subscriptions",
    "organizations_url": "https://api.github.com/users/pniko/orgs",
    "repos_url": "https://api.github.com/users/pniko/repos",
    "events_url": "https://api.github.com/users/pniko/events{/privacy}",
    "received_events_url": "https://api.github.com/users/pniko/received_events",
    "type": "User",
    "site_admin": false
  }
}