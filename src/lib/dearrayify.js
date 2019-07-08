export default function dearrayify(original, list) {
  return Array.isArray(original) ? list : list[0];
}
