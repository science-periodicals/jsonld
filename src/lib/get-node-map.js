import arrayify from './arrayify';
import getId from './get-id';

export default function getNodeMap(graph = {}) {
  const nodes = Array.isArray(graph) ? graph : arrayify(graph['@graph']);

  return nodes.reduce((nodeMap, node) => {
    const nodeId = getId(node);
    if (nodeId) {
      nodeMap[nodeId] = node;
    }
    return nodeMap;
  }, {});
}
