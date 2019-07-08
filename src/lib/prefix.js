import ontology from '@scipe/ontology';
import getId from './get-id';
import unprefix from './unprefix';

const saTerms = ontology.defines.reduce((terms, term) => {
  const id = unprefix(getId(term));
  if (id) {
    terms[id] = term;
  }
  return terms;
}, {});

export default function prefix(term) {
  if (!term) return term;
  return `${term in saTerms ? 'sa' : 'schema'}:${unprefix(term)}`;
}
