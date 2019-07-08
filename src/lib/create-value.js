import dom from 'get-dom';

export default function createValue(
  str,
  { coerceSinglePWithNoMarkupToText = false } = {}
) {
  if (!str) return str;
  // detect if str is HTML or not
  const div = dom.document().createElement('div');
  div.innerHTML = str;
  if (div.querySelector('*')) {
    if (coerceSinglePWithNoMarkupToText) {
      if (div.children.length === 1 && div.children[0].localName === 'p') {
        const $p = div.children[0];
        if (!$p.querySelector('*')) {
          return $p.textContent;
        }
      }
    }

    return {
      '@type': 'rdf:HTML',
      '@value': str
    };
  } else {
    return str;
  }
}
