export function findDirectChildByUserId(wrapper, theuserId) {
  return Array.from(wrapper.children).find(
  (child) => child.dataset.userId === theuserId
  ) || null;
}


