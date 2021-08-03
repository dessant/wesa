#! /usr/bin/env node

const path = require('path');
const {existsSync, writeFileSync} = require('fs');

const {ensureDirSync, readJsonSync, writeJsonSync} = require('fs-extra');
const dateFormat = require('dateformat');
const filenamify = require('filenamify');
const yargs = require('yargs');

function generateRevisionId(message) {
  const dateField = dateFormat(new Date(), 'yyyymmddHHMMss', true);
  const messageField = filenamify(message, {replacement: '', maxLength: 35})
    .trim()
    .replace(/ +/g, '_')
    .toLowerCase();

  return `${dateField}_${messageField}`;
}

function initRepository(argv) {
  const repoDir = path.resolve(argv.location);
  const configPath = path.join(repoDir, 'config.json');

  if (existsSync(configPath)) {
    throw new Error('Repository already exists');
  }

  ensureDirSync(repoDir);

  const config = {revisions: {local: [], sync: []}};
  writeJsonSync(configPath, config, {spaces: 2});

  console.log(`Repository has been created

Location: ${repoDir}`);
}

function createRevision(argv) {
  const {message, storage: storageArea} = argv;

  const repoDir = path.resolve(argv.location);
  const configPath = path.join(repoDir, 'config.json');

  if (!existsSync(configPath)) {
    throw new Error(`Repository does not exist

Run "wesa init" to create a repository.`);
  }

  const revisionId = generateRevisionId(message);

  const config = readJsonSync(configPath);

  if (config.revisions[storageArea].includes(revisionId)) {
    throw new Error(`Revision ID already exists`);
  }

  const downRevisionId = config.revisions[storageArea].slice(-1)[0];

  config.revisions[storageArea].push(revisionId);

  const revision = `import browser from 'webextension-polyfill';

const message = '${message}';

const revision = '${revisionId}';
const downRevision = ${downRevisionId ? `'${downRevisionId}'` : null};

const storage = browser.storage.${storageArea};

async function upgrade() {
  const changes = {};

  changes.storageVersion = revision;
  return storage.set(changes);
}

export {
  message,
  revision,
  upgrade
};
`;

  const revisionsDir = path.join(repoDir, 'revisions', storageArea);
  ensureDirSync(revisionsDir);

  const revisionPath = path.join(revisionsDir, `${revisionId}.js`);
  writeFileSync(revisionPath, revision);

  writeJsonSync(configPath, config, {spaces: 2});

  console.log(`Storage revision has been created

Location: ${revisionPath}`);
}

yargs
  .command(
    'init',
    'Create a new repository for storage revisions',
    {
      location: {
        alias: 'l',
        describe: 'Repository location',
        default: 'storage',
        requiresArg: true,
        type: 'string',
        nargs: 1
      }
    },
    initRepository
  )
  .command(
    'revision',
    'Create a new storage revision',
    {
      message: {
        alias: 'm',
        describe: 'Revision description',
        demandOption: true,
        requiresArg: true,
        type: 'string',
        nargs: 1
      },
      location: {
        alias: 'l',
        describe: 'Repository location',
        default: 'storage',
        requiresArg: true,
        type: 'string',
        nargs: 1
      },
      storage: {
        alias: 's',
        describe: 'Storage area',
        choices: ['local', 'sync'],
        default: 'local',
        requiresArg: true,
        type: 'string',
        nargs: 1
      }
    },
    createRevision
  )
  .demandCommand(1)
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .strict().argv;
