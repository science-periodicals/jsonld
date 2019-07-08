# @scipe/jsonld

[![CircleCI](https://circleci.com/gh/science-periodicals/jsonld.svg?style=svg&circle-token=91e6954abb81e6d3126ed01415f040286ee1d657)](https://circleci.com/gh/science-periodicals/jsonld)

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[sci.pe](https://sci.pe) context and a version of
[jsonld.js](https://github.com/digitalbazaar/jsonld.js) bundled with
[jsonldRdfaParser](https://github.com/scipe/jsonld-rdfa-parser)
and a custom document loader aware of science.ai context.

Note: this module is auto published to npm on CircleCI. Only run `npm version
patch|minor|major` and let CI do the rest.

## Context

```
import { context, contextUrl } from '@scipe/jsonld';
```

## JSON-LD

```
import { jsonld } from '@scipe/jsonld';
```

## Convenience methods

These methods will return a promise if the last argument is not a callback.

### flatten

flatten doc, relabel blank nodes to uuid and compact result to
science.ai context.

```
import { flatten } from '@scipe/jsonld';
```

### frame

```
import { frame } from '@scipe/jsonld';
```

### purge

```
import { purge } from '@scipe/jsonld';
```

### createNash

```
import { createNash } from '@scipe/jsonld';
```

### embed

`embed` can be used to re-create trees from the nodes of a JSON-LD
flattened document. `embed` is not as flexible as JSON-LD framing but
does not require a `@context` and can be performed efficiently as a
sync operation.


```
import { embed } from '@scipe/jsonld';

const tree = embed(node, graph);
```

- `graph`: A graph or a `nodeMap`. Note that the `@id` of the document
  nodes must be valid CURIEs (including blank nodes) or URLs.
- `node`: A node of the graph (or an `@id` as a string).


### and more...


## License

`@scipe/jsonld` is dual-licensed under commercial and open source licenses
([AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html)) based on the intended
use case. Contact us to learn which license applies to your use case.
