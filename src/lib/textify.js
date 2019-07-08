import striptags from 'striptags';
import dom from 'get-dom';
import arrayify from './arrayify';

// TODO drop join option
export default function textify(data, join) {
  data = arrayify(data);
  if (!data.length) return '';
  return join ? data.map(plainOrValue).join(join) : plainOrValue(data[0]);
}

function plainOrValue(obj) {
  if (!obj) return '';
  if (obj['@value']) {
    if (obj['@type'] === 'rdf:HTML') {
      return strip(obj['@value']);
    }
    return obj['@value'];
  }
  return obj;
}

function strip(txt) {
  if (typeof txt !== 'string') return '';
  return striptags(txt).replace(/(&\S+;)/g, (_, ent) => {
    // we keep the call to dom inside the function so taht this can be used in web-workers
    const doc = dom.document();
    const el = doc.createElement('div');

    el.innerHTML = ent;
    return el.textContent;
  });
}
