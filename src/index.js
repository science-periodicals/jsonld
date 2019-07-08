import _jsonld from './lib/jsonld';

export { default as createValue } from './lib/create-value';
export { default as getValue } from './lib/get-value';
export { default as textify } from './lib/textify';
export { default as getId } from './lib/get-id';
export { default as nodeify } from './lib/nodeify';
export { default as getNodeMap } from './lib/get-node-map';
export { default as unrole } from './lib/unrole';
export { default as arrayify } from './lib/arrayify';
export { default as dearrayify } from './lib/dearrayify';
export { default as unprefix } from './lib/unprefix';
export { default as prefix } from './lib/prefix';
export { default as relabelNodes } from './lib/relabel-nodes';

export * from './lib/constants';
export const jsonld = _jsonld; // TODO stop exporting (when we have high level compact and expand methods)
export const promises = _jsonld.promises; // TODO stop exporting

export { default as flatten } from './lib/flatten';
export { default as frame } from './lib/frame';
export { default as purge } from './lib/purge';
export { default as createNash } from './lib/create-nash';

export * from './lib/embed';
