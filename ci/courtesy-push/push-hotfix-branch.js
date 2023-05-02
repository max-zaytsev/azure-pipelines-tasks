const fs = require('fs');
const path = require('path');
const cp = require('child_process');
var util = require('../../make-util');

const token = process.env.TOKEN;
const repository = process.env.REPOSITORY// || 'AzureDevOps.ConfigChange';
const taskName = process.env.TASK_NAME// || 'BashV3';
const username = process.env.USERNAME// || 'v-mazayt';
const branch = process.env.BRANCH// || 'some-1';
const sourcesDir = process.env['BUILD_SOURCESDIRECTORY'] //|| 'D:\\GIT' ||  '/Users/krolikroger/Documents/git';
 
const hotfixFolder = process.argv[2];
if (!hotfixFolder) {
    throw new Error('No hotfixFolder provided');
}

const GIT = 'git';

function commitChanges(directory, pathToAdd, gitUrl, commitMessage) {
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

// function copyHotFixFiles(hotfixFolderPath) {
//   const src = path.join(sourcesDir, 'hotfixArtifact', 'hotfix');
//   console.log(src);
//   const dest = path.join(sourcesDir, 'AzureDevOps.ConfigChange', hotfixFolderPath);
//   console.log(dest);
//   var res = fs.existsSync(dest);
//   if (!fs.existsSync(dest)) {
//     fs.mkdirSync(dest);
//   }

//   util.cp('-rf', `${src}/*`, dest);
//   return dest;
// }

async function commitAzureDevOpsChanges(pathToAdoRepo) {
  const gitUrl = `https://${token}@dev.azure.com/v-mazayt0/AzureDevOps/_git/AzureDevOps`;
  const unifiedDepsPath = path.join('.nuget', 'externals', 'UnifiedDependencies.xml');
  const commitMessage = `Update UnifiedDependencies.xml`;
  commitChanges(pathToAdoRepo, unifiedDepsPath, gitUrl, commitMessage);
}

async function commitConfigChangeChanges(pathToCCRepo, taskName) {
  const gitUrl = `https://${token}@dev.azure.com/v-mazayt0/AzureDevOps/_git/AzureDevOps.ConfigChange`;
  const pathToHotfixFolder = hotfixFolder;

  // copyHotFixFiles(pathToHotfixFolder);

  commitMessage = `Hotfix tasks: ${taskName}`;
  commitChanges(pathToCCRepo, pathToHotfixFolder, gitUrl, commitMessage);
}

function main() {
  const pathToRepo = path.join(sourcesDir, repository);
  if (repository === 'AzureDevOps') {
    commitAzureDevOpsChanges(pathToRepo, taskName);
  }

  if (repository === 'AzureDevOps.ConfigChange') {
    commitConfigChangeChanges(pathToRepo, taskName);
  }
}

main();
