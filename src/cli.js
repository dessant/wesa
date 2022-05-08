#! /usr/bin/env node

import path from 'node:path';
import {existsSync, writeFileSync} from 'node:fs';

import pkg from 'fs-extra';
const {ensureDirSync, readJsonSync, writeJsonSync} = pkg;
import dateFormat from 'dateformat';
import filenamify from 'filenamify';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

function generateRevisionId(message) {
  const dateField = dateFormat(new Date(), 'UTC:yyyymmddHHMMss');
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

  config.revisions[storageArea].push(revisionId);

  const revision = `const message = '${message}';

const revision = '${revisionId}';

async function upgrade() {
  const changes = {};

  changes.storageVersion = revision;
  return browser.storage.${storageArea}.set(changes);
}

export {message, revision, upgrade};
`;

  const revisionsDir = path.join(repoDir, 'revisions', storageArea);
  ensureDirSync(revisionsDir);

  const revisionPath = path.join(revisionsDir, `${revisionId}.js`);
  writeFileSync(revisionPath, revision);

  writeJsonSync(configPath, config, {spaces: 2});

  console.log(`Storage revision has been created

Location: ${revisionPath}`);
}

yargs(hideBin(process.argv))
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
  .strict()
  .parse();
