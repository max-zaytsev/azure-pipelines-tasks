const azdev = require('azure-devops-node-api');

const token = process.env.TOKEN;
if (!token) {
    throw new Error('No token provided');
}

const hotfixFolder = process.argv[2];
if (!hotfixFolder) {
    throw new Error('No hotfixFolder provided');
}

const taskName = process.argv[3];
if (!taskName) {
    throw new Error('No description provided');
}

const scriptPath = `${hotfixFolder}/hotfix.ps1`
console.log(scriptPath);

const description = `Hotfix for ${taskName.split(',')} task`;

const authHandler = azdev.getPersonalAccessTokenHandler(token);
const orgUrl = 'https://dev.azure.com/v-mazayt0'; // TODO - update
const definitionId = 3; // "TFS - Prod Config Change" release definition id

const createRelease = async () => {
  console.log('Getting connection');

  const connection = new azdev.WebApi(orgUrl, authHandler);
  console.log('Getting Git API');
  const releaseApi = await connection.getReleaseApi();

  console.log('Creating TFS - Prod Config Change release');

  const command = 'run';
  const projectName = 'TestProject'

  const releaseMetadata = {
    definitionId: definitionId,
    description: description,
    variables: {
      ScriptPath: { value: scriptPath }
    }
  };
  const release = await releaseApi.createRelease(releaseMetadata, projectName);
  const releaseLink = `${orgUrl}/${projectName}/_releaseProgress?_a=release-pipeline-progress&releaseId=${release.id}`;
  console.log(`Link to the Release: ${releaseLink}`);
};

try {
    createRelease();
   // createPullRequest();
} catch (err) {
    console.log(err);
    throw err;
}
