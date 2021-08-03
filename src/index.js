import browser from 'webextension-polyfill';
import {indexOf, last, slice} from 'lodash-es';

async function storageRevision(area = 'local') {
  const {storageVersion} = await browser.storage[area].get('storageVersion');
  return storageVersion;
}

async function getRevisions(context, area) {
  return context('./config.json').revisions[area];
}

async function upgrade(context, {area = 'local'} = {}) {
  const revisions = await getRevisions(context, area);
  const fromRev = await storageRevision(area);
  const toRev = last(revisions);

  if (fromRev === toRev) {
    return;
  }

  const migrationPath = slice(
    revisions,
    indexOf(revisions, fromRev) + 1,
    indexOf(revisions, toRev) + 1
  );

  console.log(`Migrating storage (${area}): ${fromRev} => ${toRev}`);

  for (const revisionId of migrationPath) {
    const revision = context(`./revisions/${area}/${revisionId}.js`);
    console.log(
      `Applying revision (${area}): ${revision.revision} - ${revision.message}`
    );
    await revision.upgrade();
  }
}

async function migrate(context, {area = 'local'} = {}) {
  return upgrade(context, {area});
}

export {migrate, upgrade};
