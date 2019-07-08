export default function promisify(original) {
  return function() {
    return new Promise((resolve, reject) => {
      original.apply(this, arguments);
    });
  };
}
