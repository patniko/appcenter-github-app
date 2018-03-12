# Sample post-build script for Github PR checks
#
# This script updates the Github status for commits based on whether or not
# a successful build occurred against that sha. It can be used in conjunction
# with the Azure Function to create a end to end PR check workflow or alone if
# you only wish to check branches preconfigured for continuous builds in App Center.
 
function parse_git_hash() {
  git rev-parse HEAD 
}

SHA=$(parse_git_hash)
github_notify_build_state() {
  SUCCEEDED="true"
  if [ "$1" != true ]; then 
    SUCCEEDED="false"
  fi
  curl -H "Content-Type: application/json" \
  -H "User-Agent: appcenter-ci" \
  -H "Content-Type: application/json" \
  --data "{
    \"sha\":\"${SHA}\",
    \"buildId\":\"${APPCENTER_BUILD_ID}\",
    \"branch\":\"${APPCENTER_BRANCH}\",
    \"repo_path\":\"${PR_GITHUB_REPO}\",
    \"installation_id\":\"${PR_INSTALLATION_ID}\",
    \"succeeded\":\"${SUCCEEDED}\", 
    \"appcenter_app\": \"${PR_APPCENTER_APP}\"
        }" \
    https://appcenterfunctions.azurewebsites.net/api/PrCheckSetup
}

if [ "$AGENT_JOBSTATUS" != "Succeeded" ]; then
    github_notify_build_state false
    exit 0
fi

github_notify_build_state true
