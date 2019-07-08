import arrayify from './arrayify';
import uuid from 'uuid';

const reUuidBlankNode = /^_:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function relabelNodes(graph, opts = {}) {
  opts = Object.assign({}, opts, {
    relabelMap: Object.assign({}, opts.relabelMap)
  });

  let nodes, isNamedGraph;
  if (Array.isArray(graph)) {
    nodes = graph;
  } else {
    isNamedGraph = true;
    nodes = [graph].concat(graph['@graph'] || []);
  }

  nodes.forEach((node, i) => {
    Object.keys(node).forEach(p => {
      if (!(p === '@graph' && i === 0 && isNamedGraph)) {
        if (Array.isArray(node[p])) {
          for (let i = 0; i < node[p].length; i++) {
            if (typeof node[p][i] === 'string') {
              node[p][i] = remap(node, p, node[p][i], opts);
            } else {
              Object.keys(node[p][i]).forEach(key => {
                node[p][i][key] = remap(node, p, node[p][i][key], opts);
              });
            }
          }
        } else {
          if (typeof node[p] === 'string') {
            node[p] = remap(node, p, node[p], opts);
          } else {
            Object.keys(node[p]).forEach(key => {
              node[p][key] = remap(node, p, node[p][key], opts);
            });
          }
        }
      }
    });
  });

  return graph;
}

function remap(node, prop, value, opts) {
  if (
    typeof value === 'string' &&
    (value in opts.relabelMap || (opts.blankNode && value.startsWith('_:')))
  ) {
    const isUuidBlankNode = reUuidBlankNode.test(value);
    if (
      opts.uuid &&
      !(value in opts.relabelMap) &&
      (!opts.preserveUuidBlankNodes || !isUuidBlankNode)
    ) {
      opts.relabelMap[value] = `_:${uuid.v4()}`;
    }
    // !! we do NOT relabel sameAs (NEVER)
    if (prop !== 'sameAs' && value in opts.relabelMap) {
      if (
        prop === '@id' &&
        opts.sameAs &&
        (!value.startsWith('_:') ||
          reUuidBlankNode.test(value) ||
          opts.sameAs === 'all')
      ) {
        node.sameAs = arrayify(node.sameAs)
          .filter(x => x !== value)
          .concat(value);
      }
      return opts.relabelMap[value];
    } else {
      return value;
    }
  } else {
    return value;
  }
}
