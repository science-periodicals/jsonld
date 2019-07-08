import { parseIndexableString } from '@scipe/collate';
import { contextUrl, reUuidBlankNode, reRelabeledBlankNode } from './constants';
import traverse from 'traverse';
import jsonld from './jsonld';

/**
 * frame
 */
export default function frame(doc, docFrame, opts, callback) {
  if (!doc['@context']) {
    doc = Object.assign({ '@context': contextUrl }, doc);
  }

  if (!docFrame['@context']) {
    docFrame = Object.assign({ '@context': contextUrl }, docFrame);
  }

  function _frame(doc, docFrame, opts, callback) {
    if (!callback) {
      callback = opts;
      opts = {};
    }
    opts = opts || {};

    if (opts.preserveUuidBlankNodes) {
      docFrame = traverse(docFrame).map(function(x) {
        // !!! we check that x is a string as [string].toString() is coerced to string...
        if (typeof x === 'string' && reUuidBlankNode.test(x)) {
          this.update(x.replace(/^_:/, 'tmpblank:'));
        }
      });

      doc = traverse(doc).map(function(x) {
        // !!! we check that x is a string as [string].toString() is coerced to string...
        if (typeof x === 'string' && reUuidBlankNode.test(x)) {
          this.update(x.replace(/^_:/, 'tmpblank:'));
        }
      });
    }

    jsonld.frame(doc, docFrame, opts, (err, framed) => {
      if (err) return callback(err);

      if (opts.preserveUuidBlankNodes) {
        traverse(framed).forEach(function(x) {
          // !!! we check that x is a string as [string].toString() is coerced to string...
          if (typeof x === 'string' && reRelabeledBlankNode.test(x)) {
            this.update(x.replace(/^tmpblank:/, '_:'));
          }
        });
      }

      const idCount = {};
      const refCount = {};
      if (
        opts.removeUnnecessaryBlankNodeIds ||
        opts.forceRemoveUnnecessaryBlankNodeIds
      ) {
        traverse(framed).forEach(function(x) {
          if (typeof x === 'string' && x.startsWith('_:')) {
            if (this.key === '@id') {
              if (x in idCount) {
                idCount[x]++;
              } else {
                idCount[x] = 1;
              }
            } else {
              if (x in refCount) {
                refCount[x]++;
              } else {
                refCount[x] = 1;
              }
            }
          }
        });

        traverse(framed).forEach(function(x) {
          if (this.key === '@id' && x in idCount && !refCount[x]) {
            // do not remove blank node necessary for couchdb
            if (this.parent && this.parent.node) {
              const { _id } = this.parent.node;
              if (_id && reUuidBlankNode.test(x)) {
                const [scopeId, type, nodeId] = parseIndexableString(_id);
                if (type === 'node' && nodeId === x) {
                  return;
                }
              }
            }

            // do not remove blank node kept by the `preserveUuidBlankNodes` options unless `forceRemoveUnnecessaryBlankNodeIds` is true
            if (
              !opts.preserveUuidBlankNodes ||
              opts.forceRemoveUnnecessaryBlankNodeIds ||
              (opts.preserveUuidBlankNodes && !reUuidBlankNode.test(x))
            ) {
              this.remove();
            }
          }
        });
      }

      callback(null, framed);
    });
  }

  if (typeof arguments[arguments.length - 1] === 'function') {
    return _frame(doc, docFrame, opts, callback);
  } else {
    return new Promise((resolve, reject) => {
      _frame(doc, docFrame, opts, (err, framed) => {
        if (err) return reject(err);
        resolve(framed);
      });
    });
  }
}
