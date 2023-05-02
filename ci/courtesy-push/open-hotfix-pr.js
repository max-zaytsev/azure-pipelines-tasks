const azdev = require('azure-devops-node-api');

const token = process.env.TOKEN;
const azureDevOpsRepoId = process.env.REPOSITORY// || 'AzureDevOps';
const taskName = process.env.TASK_NAME// || 'BashV3';
const branch = process.env.BRANCH// || 'Users/krolikroger/Documents/git';

const orgUrl = 'https://dev.azure.com/v-mazayt0'; 
const authHandler = azdev.getPersonalAccessTokenHandler(token);

//const azureDevOpsRepoId = 'AzureDevOps';// '8caf57cb-9db1-4bf0-88e1-485e359f3a2b';
const project = 'AzureDevOps';

const refs = {
    sourceRefName: `refs/heads/${branch}`,
    targetRefName: 'refs/heads/master'
};

const pullRequestToCreate = {
    ...refs,
    title: `Hotfix for ${taskName} task`,
    description: 'Autogenerated hotfix'
};

const createPullRequest = async () => {
    console.log('Getting connection');
    const connection = new azdev.WebApi(orgUrl, authHandler);
    console.log('Getting Git API');
    const gitApi = await connection.getGitApi();
    console.log('Checking if an active pull request for the source and target branch already exists');
    let PR = (await gitApi.getPullRequests(azureDevOpsRepoId, refs, project))[0];

    if (PR) {
        console.log('PR already exists');
    } else {
        console.log('PR does not exist; creating PR');
        PR = await gitApi.createPullRequest(pullRequestToCreate, azureDevOpsRepoId, project);
    }

    const prLink = `${orgUrl}/${project}/_git/${azureDevOpsRepoId}/pullrequest/${PR.pullRequestId}`;
    console.log(`Link to the PR: ${prLink}`);
    console.log(`##vso[task.setvariable variable=PR_ID]${PR.pullRequestId}`);
    console.log(`##vso[task.setvariable variable=PR_LINK]${prLink}`);
};

try {
    createPullRequest();
} catch (err) {
    console.log(err);
    throw err;
}
