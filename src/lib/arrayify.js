export default function arrayify(value) {
  if (value === undefined) return [];
  if (value) {
    value = value['@list'] || value['@set'] || value;
  }
  return Array.isArray(value) ? value : [value];
}
