import { context } from './constants';
import jsonld from 'jsonld';
import jsonldRdfaParser from 'jsonld-rdfa-parser';
import isClient from 'is-client';

const { version } = require('../../package.json');
jsonld.registerRDFParser('text/html', jsonldRdfaParser);

const documentLoader = jsonld.documentLoaders[isClient() ? 'xhr' : 'node']({
  usePromise: false
});

function customLoader(url, callback) {
  if (/^https:\/\/sci.pe\/*$/.test(url)) {
    return callback(null, {
      contextUrl: null, // only for a context via a link header
      document: context, // the actual document that was loaded
      documentUrl: url // the actual context URL after redirects
    });
  }
  documentLoader(url, callback);
}
customLoader.version = version;
customLoader.definedIn = __dirname;

if (!jsonld.documentLoader || !jsonld.documentLoader.version) {
  Object.defineProperty(jsonld, 'documentLoader', {
    value: customLoader,
    configurable: false,
    enumerable: true,
    writable: false
  });
} else if (jsonld.documentLoader.version !== version) {
  console.warn(
    `Version mismatch in jsonld singleton: ${version} vs ${
      jsonld.documentLoader.version
    } (${jsonld.documentLoader.definedIn})`
  );
}

export default jsonld;
