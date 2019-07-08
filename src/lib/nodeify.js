export default function nodeify(value) {
  if (typeof value === 'string') {
    return { '@id': value };
  }
  return value;
}
