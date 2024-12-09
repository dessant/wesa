#! /usr/bin/env node

import path from 'node:path';
import {writeFile} from 'node:fs/promises';

import {pathExists, ensureDir, readJson, writeJson} from 'fs-extra/esm';
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

async function initRepository(argv) {
  const repoDir = path.resolve(argv.location);
  const configPath = path.join(repoDir, 'config.json');

  if (await pathExists(configPath)) {
    throw new Error('Repository already exists');
  }

  await ensureDir(repoDir);

  const config = {revisions: {local: [], session: [], sync: []}};
  await writeJson(configPath, config, {spaces: 2});

  console.log(`Repository has been created

Location: ${repoDir}`);
}

async function createRevision(argv) {
  const {message, storage: storageArea} = argv;

  const repoDir = path.resolve(argv.location);
  const configPath = path.join(repoDir, 'config.json');

  if (!(await pathExists(configPath))) {
    throw new Error(`Repository does not exist

Run "wesa init" to create a repository.`);
  }

  const revisionId = generateRevisionId(message);

  const config = await readJson(configPath);

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
  await ensureDir(revisionsDir);

  const revisionPath = path.join(revisionsDir, `${revisionId}.js`);
  await writeFile(revisionPath, revision);

  await writeJson(configPath, config, {spaces: 2});

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
        choices: ['local', 'session', 'sync'],
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
