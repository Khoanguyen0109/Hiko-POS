const DOC_NODE_TYPES = {
  FOLDER: "folder",
  DOC: "doc",
} as const;

const DOC_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export { DOC_NODE_TYPES, DOC_STATUS };

export type DocNodeType = (typeof DOC_NODE_TYPES)[keyof typeof DOC_NODE_TYPES];
export type DocStatus = (typeof DOC_STATUS)[keyof typeof DOC_STATUS];
