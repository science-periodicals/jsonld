export default function getId(object, roleProp) {
  if (object) {
    if (Array.isArray(object)) {
      if (object.length === 1) {
        return getId(object[0], roleProp);
      }
    } else {
      if (typeof roleProp === 'string') {
        return getId(object[roleProp]);
      }
      const objectId = object['@id'] || object;
      if (typeof objectId === 'string') {
        return objectId;
      }
    }
  }
}
