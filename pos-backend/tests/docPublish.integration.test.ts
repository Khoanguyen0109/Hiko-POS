// @ts-nocheck
import { describe, it, expect, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import DocNode from "../models/docNodeModel.js";
import "../models/userModel.js";
import {
  createDoc,
  createFolder,
  getDocById,
  getDocTree,
  publishDocNode,
} from "../services/docService.js";
import { DOC_NODE_TYPES, DOC_STATUS } from "../constants/doc.js";
import { userRoles } from "../constants/user.js";

const adminUser = {
  _id: new mongoose.Types.ObjectId(),
  role: userRoles.ADMIN,
};

const memberUser = {
  _id: new mongoose.Types.ObjectId(),
  role: userRoles.USER,
};

function flattenTree(nodes, acc = []) {
  for (const node of nodes) {
    acc.push(node);
    if (node.children?.length) flattenTree(node.children, acc);
  }
  return acc;
}

describe("doc publish integration", () => {
  beforeEach(async () => {
    await DocNode.deleteMany({});
  });

  it("published doc appears in admin and member trees and is readable by member", async () => {
    const folder = await createFolder(adminUser, { title: "SOPs", parentId: null });
    const doc = await createDoc(adminUser, {
      title: "Opening Checklist",
      parentId: String(folder._id),
      content: "<p>Turn on lights</p>",
    });

    expect(doc.status).toBe(DOC_STATUS.DRAFT);

    const published = await publishDocNode(adminUser, String(doc._id));
    expect(published.status).toBe(DOC_STATUS.PUBLISHED);
    expect(published.type).toBe(DOC_NODE_TYPES.DOC);

    const adminTree = await getDocTree(adminUser);
    const adminFlat = flattenTree(adminTree);
    const adminDoc = adminFlat.find((n) => n.type === DOC_NODE_TYPES.DOC);
    expect(adminDoc).toBeDefined();
    expect(adminDoc.status).toBe(DOC_STATUS.PUBLISHED);

    const memberTree = await getDocTree(memberUser);
    const memberFlat = flattenTree(memberTree);
    expect(memberFlat.map((n) => n._id)).toContain(String(doc._id));

    const memberDoc = await getDocById(String(doc._id), memberUser);
    expect(memberDoc.status).toBe(DOC_STATUS.PUBLISHED);
    expect(memberDoc.content).toContain("Turn on lights");

    const memberDocJson = JSON.parse(JSON.stringify(memberDoc));
    expect(memberDocJson.type).toBe(DOC_NODE_TYPES.DOC);
    expect(memberDocJson.content).toContain("Turn on lights");
  });

  it("published root-level doc appears for member", async () => {
    const doc = await createDoc(adminUser, {
      title: "Root Doc",
      parentId: null,
      content: "<p>Hello</p>",
    });

    await publishDocNode(adminUser, String(doc._id));

    const memberTree = await getDocTree(memberUser);
    const memberFlat = flattenTree(memberTree);
    expect(memberFlat.some((n) => n._id === String(doc._id))).toBe(true);
  });
});
