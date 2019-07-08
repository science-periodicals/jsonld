export default function getValue(node) {
  if (!node) return node;
  return node['@value'] || node['@id'] || node;
}
