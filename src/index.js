import {indexOf, last, slice} from 'lodash-es';

async function upgrade(
  context,
  {area = 'local', data = null, silent = false} = {}
) {
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

  if (!silent) {
    console.log(`Migrating storage (${area}): ${fromRev} => ${toRev}`);
  }

  for (const revisionId of migrationPath) {
    const revision = await context.getRevision({area, revision: revisionId});
    if (!silent) {
      console.log(
        `Applying revision (${area}): ${revision.revision} - ${revision.message}`
      );
    }
    await revision.upgrade(data);
  }
}

async function migrate(
  context,
  {area = 'local', data = null, silent = false} = {}
) {
  return upgrade(context, {area, data, silent});
}

export {migrate, upgrade};
