export default function unprefix(uri = '') {
  return uri.replace(/^.*:/, '');
}
