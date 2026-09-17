export const providesList = (type, result, idKey = "_id") => {
  const items = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.promotions)
        ? result.promotions
        : [];

  return [
    ...items.map((item) => ({ type, id: item[idKey] })),
    { type, id: "LIST" },
  ];
};

export const invalidatesList = (type, id) =>
  id ? [{ type, id }, { type, id: "LIST" }] : [{ type, id: "LIST" }];
