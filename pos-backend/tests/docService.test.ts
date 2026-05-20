// @ts-nocheck
import { describe, it, expect } from "@jest/globals";
import {
  buildTreeFromFlatNodes,
  filterNodesForMember,
  pruneEmptyFolders,
} from "../services/docService.js";
import { DOC_NODE_TYPES, DOC_STATUS } from "../constants/doc.js";

const flatNodes = [
  {
    _id: "folder1",
    type: DOC_NODE_TYPES.FOLDER,
    parentId: null,
    title: "SOPs",
    status: DOC_STATUS.PUBLISHED,
    sortOrder: 0,
  },
  {
    _id: "doc1",
    type: DOC_NODE_TYPES.DOC,
    parentId: "folder1",
    title: "Opening",
    status: DOC_STATUS.PUBLISHED,
    sortOrder: 0,
  },
  {
    _id: "doc2",
    type: DOC_NODE_TYPES.DOC,
    parentId: "folder1",
    title: "Closing Draft",
    status: DOC_STATUS.DRAFT,
    sortOrder: 1,
  },
  {
    _id: "folder2",
    type: DOC_NODE_TYPES.FOLDER,
    parentId: null,
    title: "HR",
    status: DOC_STATUS.PUBLISHED,
    sortOrder: 1,
  },
  {
    _id: "doc3",
    type: DOC_NODE_TYPES.DOC,
    parentId: "folder2",
    title: "Onboarding Draft",
    status: DOC_STATUS.DRAFT,
    sortOrder: 0,
  },
];

describe("buildTreeFromFlatNodes", () => {
  it("builds nested tree sorted by sortOrder", () => {
    const tree = buildTreeFromFlatNodes(flatNodes);

    expect(tree).toHaveLength(2);
    expect(tree[0]._id).toBe("folder1");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0]._id).toBe("doc1");
    expect(tree[0].children[1]._id).toBe("doc2");
    expect(tree[1]._id).toBe("folder2");
  });
});

describe("filterNodesForMember", () => {
  it("includes published docs and their ancestor folders only", () => {
    const filtered = filterNodesForMember(flatNodes);

    expect(filtered.map((n) => n._id)).toEqual(["folder1", "doc1"]);
  });
});

describe("pruneEmptyFolders", () => {
  it("removes folders with no visible children", () => {
    const filtered = filterNodesForMember(flatNodes);
    const tree = buildTreeFromFlatNodes(filtered);
    const pruned = pruneEmptyFolders(tree);

    expect(pruned).toHaveLength(1);
    expect(pruned[0]._id).toBe("folder1");
    expect(pruned[0].children).toHaveLength(1);
    expect(pruned[0].children[0]._id).toBe("doc1");
  });
});
