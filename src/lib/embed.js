import arrayify from './arrayify';
import getId from './get-id';
import getNodeMap from './get-node-map';

export function getSubNodeMap(
  node,
  nodeMap,
  keys,
  opts = {},
  _subNodeMap,
  _originalNode,
  _blacklist
) {
  _blacklist = _blacklist || new Set(arrayify(opts.blacklist));
  _subNodeMap = _subNodeMap || {};
  _originalNode = _originalNode || node;

  (keys === '*' ? Object.keys(node) : keys).forEach(p => {
    if (!_blacklist.has(p)) {
      const values = arrayify(node[p]);
      values.forEach(value => {
        const id = getId(value);
        if (id in nodeMap && !(id in _subNodeMap)) {
          const hydrated = nodeMap[id];
          if (!(id in _subNodeMap) && id !== getId(_originalNode)) {
            _subNodeMap[id] = hydrated;
          }
          getSubNodeMap(
            hydrated,
            nodeMap,
            Object.keys(hydrated).filter(key => key !== '@id'),
            opts,
            _subNodeMap,
            _originalNode,
            _blacklist
          );
        }
      });
    }
  });
  return _subNodeMap;
}

export function embed(node, graph, opts = {}, _nodeMap, _stack) {
  _stack = _stack || [];

  if (_nodeMap == null) {
    // this is only computed on the first call;
    graph = graph['@graph'] || graph;
    // if not an array, if assume that it's a nodeMap
    _nodeMap = Array.isArray(graph) ? getNodeMap(graph) : graph;

    if (opts.keys) {
      _nodeMap = getSubNodeMap(node, _nodeMap, opts.keys, {
        blacklist: opts.blacklist
      });
    }
  }

  if (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    node == null
  ) {
    return embedMatch(node, _nodeMap, _stack);
  } else if (Array.isArray(node)) {
    return node.map(n => embed(n, null, null, _nodeMap, _stack));
  } else {
    let keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === '@id') {
      return embedMatch(node, _nodeMap, _stack);
    } else {
      return keys.reduce((tree, p) => {
        let value = node[p];
        if (p[0] === '@') {
          tree[p] = value;
        } else if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof node === 'boolean' ||
          value == null
        ) {
          tree[p] = embedMatch(value, _nodeMap, _stack);
        } else {
          tree[p] = embed(value, null, null, _nodeMap, _stack);
        }
        return tree;
      }, {});
    }
  }
}

function embedMatch(value, _nodeMap, _stack) {
  let key = value != null && (value['@id'] || value);
  let match = typeof key === 'string' && key.includes(':') && _nodeMap[key]; // restrict keys to CURIE (this is fragile but better than nothing)
  if (match) {
    if (has(_stack, match['@id'])) {
      return value;
    } else {
      _stack.push(match['@id']);
      let framed = embed(match, null, null, _nodeMap, _stack);
      _stack.pop();
      return framed;
    }
  } else {
    return value;
  }
}

function has(stack, id) {
  for (let item of stack) {
    if (item === id) {
      return true;
    }
  }
  return false;
}
