import arrayify from './arrayify';

export default function unrole(obj, roleProp) {
  if (!roleProp) {
    return obj;
  }
  if (obj && obj[roleProp]) {
    obj = arrayify(obj[roleProp])[0];
  }
  return obj;
}
