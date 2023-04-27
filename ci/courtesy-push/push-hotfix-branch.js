const fs = require('fs');
const path = require('path');
const got = require('got');
const cp = require('child_process');
var util = require('../../make-util');

const repository = process.env.REPOSITORY || 'AzureDevOps';
const taskName = process.env.TASK_NAME || 'BashV3';
const username = process.env.USERNAME || 'v-mazayt';
const sourcesDir = process.env['BUILD_SOURCESDIRECTORY'] || '/Users/krolikroger/Documents/git';
const GIT = 'git';

/**
 * Queries whatsprintis.it for current sprint version
 *
 * @throws An error will be thrown if the response does not contain a sprint version as a three-digit numeric value
 * @returns current sprint version
 */
async function getCurrentSprint() {
  const response = await got.get('https://whatsprintis.it/?json', { responseType: 'json' });
  const sprint = response.body.sprint;

  if (!/^\d\d\d$/.test(sprint)) {
    throw new Error(`Sprint must be a three-digit number; received: ${sprint}`);
  }
  return sprint;
}

function commitChanges(directory, pathToAdd, gitUrl, branch, commitMessage) {
  execInForeground(`${GIT} add ${pathToAdd}`, directory);
  gitConfig();
  execInForeground(`${GIT} checkout -b ${branch}`, directory);
  execInForeground(`${GIT} commit -m "${commitMessage}" `, directory);
  execInForeground(`${GIT} push --set-upstream ${gitUrl} ${branch}`, directory);
}

function gitConfig() {
  execInForeground(`${GIT} config --global user.email "${username}@microsoft.com"`, null);
  execInForeground(`${GIT} config --global user.name "${username}"`, null);
}

function execInForeground(command, directory, dryrun = false) {
  directory = directory || '.';
  console.log(`% ${command}`);
  if (!dryrun) {
    cp.execSync(command, { cwd: directory, stdio: [process.stdin, process.stdout, process.stderr] });
  }
}

function copyHotFixFiles(hotfixFolderPath) {
  const src = path.join(sourcesDir, 'hotfixArtifact', 'hotfix');
  console.log(src);
  const dest = path.join(sourcesDir, 'AzureDevOps.ConfigChange', hotfixFolderPath);
  console.log(dest);
  var res = fs.existsSync(dest);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }

  util.cp('-rf', `${src}/*`, dest);
  return dest;
}

async function commitAzureDevOpsChanges(pathToAdoRepo, taskName) {
  const currentSprint = await getCurrentSprint();
  const gitUrl = `https://${process.env.TOKEN}@dev.azure.com/v-mazayt0/AzureDevOps/_git/AzureDevOps`;
  const branch = `users/${username}/m${currentSprint}/${taskName}-UpdateUnifiedDeps-new10`;
  console.log(`##vso[task.setVariable variable=hotFixBranch]${branch}`);
  const pathToUnifiedDependencies = path.join('.nuget', 'externals', 'UnifiedDependencies.xml');
  const commitMessage = `Update UnifiedDependencies.xml for ${taskName}`;
  commitChanges(pathToAdoRepo, pathToUnifiedDependencies, gitUrl, branch, commitMessage);
}

async function commitConfigChangeChanges(pathToCCRepo, taskName) {
  const currentSprint = await getCurrentSprint();
  const pathToHotfixFolder = path.join('tfs', `m${currentSprint}`, `${taskName}`);

  copyHotFixFiles(pathToHotfixFolder);

  const branch = `users/${username}/m${currentSprint}/${taskName}/Hotfix`;
  console.log(`##vso[task.setVariable variable=hotFixBranch]${branch}`);

  commitMessage = `Hotfix tasks: ${taskName}`;
  commitChanges(pathToCCRepo, pathToHotfixFolder, branch, commitMessage);
}

function main() {
  console.log(sourcesDir + ' ' + repository);
  const pathToRepo = path.join(sourcesDir, repository);

  if (repository === 'AzureDevOps') {
    commitAzureDevOpsChanges(pathToRepo, taskName);
  }

  if (repository === 'AzureDevOps.ConfigChange') {
    commitConfigChangeChanges(pathToRepo, taskName);
  }
}

main();
