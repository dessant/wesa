# Wesa

[![Version](https://img.shields.io/npm/v/wesa.svg?colorB=007EC6)](https://www.npmjs.com/package/wesa)

Wesa enables you to perform storage schema migrations
for browser extensions packaged with webpack.

## Installation

```sh
npm install wesa webextension-polyfill
```

## Usage

The `wesa` CLI tool is used to set up and configure revisions.

```
wesa init

Create a new repository for storage revisions

Options:
  -l, --location  Repository location              [string] [default: "storage"]
```

```
wesa revision

Create a new storage revision

Options:
  -m, --message   Revision description                       [string] [required]
  -l, --location  Repository location              [string] [default: "storage"]
  -s, --storage   Storage area
                          [string] [choices: "local", "sync"] [default: "local"]
```

Initiate a repository that will hold revisions and create your first revision.

```sh
wesa init
wesa revision -m "Revision description"
```

A revision module will be created at `storage/revisions`, edit the `upgrade`
function to declare storage changes.

A revision is made by modifying the `changes` object, which is persisted
to storage at the end of the function. You also have direct access
to the extension storage through the `storage` object, and you can
import any module that is needed to perform the revision.

```js
async function upgrade() {
  const changes = {};

  // migration code goes here, ex:
  // changes.color = '#fff'

  changes.storageVersion = revision;
  return storage.set(changes);
}
```

Call `migrate` from the background script to perform a migration.

```js
import {migrate} from 'wesa';

async function init() {
  const context = require.context('storage', true, /\.(?:js|json)$/i);
  await migrate(context, {area: 'local'});
}

init();
```

## License

Copyright (c) 2021 Armin Sebastian

This software is released under the terms of the MIT License.
See the [LICENSE](LICENSE) file for further information.
