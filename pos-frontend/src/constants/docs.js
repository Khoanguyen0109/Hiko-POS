export const DOCS_ROOT_ID = "__root__";

export const getDocNodeType = (node) => node?.nodeType || node?.type;

export const isDocNode = (node) => getDocNodeType(node) === "doc";

export const isFolderNode = (node) => getDocNodeType(node) === "folder";

/** API responses wrap the node in `{ data }`; thunks return that envelope. */
export const getDocApiNode = (response) => response?.data ?? response;
