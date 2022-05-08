import {indexOf, last, slice} from 'lodash-es';

async function upgrade(context, {area = 'local'} = {}) {
  const revisions = await context.getAvailableRevisions({area});
  const fromRev = await context.getCurrentRevision({area});
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
    const revision = await context.getRevision({area, revision: revisionId});
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
