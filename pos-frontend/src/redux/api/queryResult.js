export const unwrapList = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
};

export const unwrapPaginated = (result) => ({
  items: unwrapList(result),
  pagination: result?.pagination ?? null,
});
