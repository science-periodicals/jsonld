import { parseIndexableString } from '@scipe/collate';
import traverse from 'traverse';
import { contextUrl, reUuidBlankNode, reRelabeledBlankNode } from './constants';
import jsonld from './jsonld';
import arrayify from './arrayify';
import relabelNodes from './relabel-nodes';

/**
 * flatten doc, relabel blank nodes to uuid and compact result to
 * science.ai context
 */
export default function flatten(doc, opts, callback) {
  if (!doc['@context']) {
    doc = Object.assign({ '@context': contextUrl }, doc);
  }

  function _flatten(doc, opts, callback) {
    if (!callback) {
      callback = opts;
      opts = {};
    } else {
      opts = opts || {};
    }

    if (opts.preserveUuidBlankNodes) {
      doc = traverse(doc).map(function(x) {
        // !!! we check that x is a string as [string].toString() is coerced to string...
        if (typeof x === 'string' && reUuidBlankNode.test(x)) {
          this.update(x.replace(/^_:/, 'tmpblank:'));
        }
      });
    }

    jsonld.flatten(doc, contextUrl, opts, (err, flattened) => {
      if (err) return callback(err);

      if (opts.preserveUuidBlankNodes) {
        traverse(flattened).forEach(function(x) {
          // !!! we check that x is a string as [string].toString() is coerced to string...
          if (typeof x === 'string' && reRelabeledBlankNode.test(x)) {
            this.update(x.replace(/^tmpblank:/, '_:'));
          }
        });
      }

      const nodes = arrayify(flattened['@graph']);

      // create a relabelMap to preserve the blank nodes of node having an _id
      const relabelMap = nodes.reduce((relabelMap, node) => {
        if (
          node._id &&
          typeof node['@id'] === 'string' &&
          node['@id'].startsWith('_:')
        ) {
          const [scopeId, type, nodeId] = parseIndexableString(node._id);
          if (type === 'node' && nodeId) {
            relabelMap[node['@id']] = nodeId;
          }
        }
        return relabelMap;
      }, {});
      if ('@graph' in doc && Object.keys(doc).length > 2) {
        flattened = Object.assign(
          { '@context': doc['@context'] },
          flattened['@graph'][0]
        );
        if (!doc['@id']) {
          delete flattened['@id'];
        }
      }
      opts = Object.assign(
        {
          uuid: true,
          blankNode: true
        },
        opts,
        {
          relabelMap: Object.assign({}, opts.relabelMap, relabelMap)
        }
      );
      relabelNodes(flattened, opts);
      callback(null, flattened);
    });
  }

  if (typeof arguments[arguments.length - 1] === 'function') {
    return _flatten(doc, opts, callback);
  } else {
    return new Promise((resolve, reject) => {
      _flatten(doc, opts, (err, flattened) => {
        if (err) return reject(err);
        resolve(flattened);
      });
    });
  }
}
