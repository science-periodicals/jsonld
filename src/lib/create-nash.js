import { contextUrl } from './constants';
import { createHash } from 'crypto';
import jsonld from './jsonld';

export default function createNash(doc, options, callback) {
  if (!doc['@context']) {
    doc = Object.assign({ '@context': contextUrl }, doc);
  }

  function _createNash(doc, options, callback) {
    if (!callback) {
      callback = options;
      options = {};
    }

    // compute of checksum of the graph using the RDF Dataset Normalization Algorithm
    // (URDNA2015), see: http://json-ld.github.io/normalization/spec/
    jsonld.normalize(
      doc,
      {
        algorithm: 'URDNA2015',
        format: 'application/nquads'
      },
      (err, normalized) => {
        // normalized is a string that is a canonical representation of the document that we
        // used for hashing
        if (err) return callback(err);

        // went with base64 instead of hex as it tends to be shorter
        const nash = createHash('sha256')
          .update(normalized, 'utf8')
          .digest('base64');

        callback(null, nash);
      }
    );
  }

  if (typeof arguments[arguments.length - 1] === 'function') {
    return _createNash(doc, options, callback);
  } else {
    return new Promise((resolve, reject) => {
      _createNash(doc, options, (err, nash) => {
        if (err) return reject(err);
        resolve(nash);
      });
    });
  }
}
