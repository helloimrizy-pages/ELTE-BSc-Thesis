export const isValidFirestoreId = (id: string) => {
  // Firestore IDs must not contain forward slashes
  return id && !id.includes("/") && id.length > 0;
};
