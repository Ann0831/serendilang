export function findDirectChildByUserId(wrapper, theuserId) {
  const key = String(theuserId);
  return Array.from(wrapper.children).find(
  (child) => String(child.dataset.userId || "") === key
  ) || null;
}

