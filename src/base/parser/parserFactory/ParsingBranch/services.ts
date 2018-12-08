let counter = 0;

export function getUniqueId() {
  counter++;
  return `${counter}`;
}
