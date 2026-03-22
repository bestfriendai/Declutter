/** Generate a unique ID using timestamp + dual random segments to virtually eliminate collisions */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  const random2 = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${random}${random2}`;
}
