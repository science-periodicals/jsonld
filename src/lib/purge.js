import { contextUrl } from './constants';
import frame from './frame';
import flatten from './flatten';

/**
 * purge dead nodes by framing and reflatening
 */
export default function purge(doc, root, opts, callback) {
  // so that we don't mutate doc and @context if not existing
  doc = Object.assign({ '@context': contextUrl }, doc);

  const docFrame = {
    '@context': contextUrl,
    '@id': root['@id'] || root,
    '@embed': '@last'
  };

  function _purge(doc, docFrame, opts, callback) {
    if (!callback) {
      callback = opts;
      opts = {};
    }

    frame(
      doc['@graph'] ? { '@graph': doc['@graph'] } : doc,
      docFrame,
      opts,
      (err, framed) => {
        if (err) return callback(err);

        flatten(framed, opts, (err, flattened) => {
          if (err) return callback(err);
          if (doc['@graph']) {
            flattened = Object.assign({}, doc, flattened); // perserve graph metadata
          }

          callback(null, flattened);
        });
      }
    );
  }

  if (typeof arguments[arguments.length - 1] === 'function') {
    return _purge(doc, docFrame, opts, callback);
  } else {
    return new Promise((resolve, reject) => {
      _purge(doc, docFrame, opts, (err, purged) => {
        if (err) return reject(err);
        resolve(purged);
      });
    });
  }
}
