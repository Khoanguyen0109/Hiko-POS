import createHttpError from "http-errors";
import type { Types } from "mongoose";
import DocNode from "../models/docNodeModel.js";
import { DOC_NODE_TYPES, DOC_STATUS } from "../constants/doc.js";
import { userRoles } from "../constants/user.js";

export interface FlatDocNode {
  _id: string;
  type: string;
  parentId: string | null;
  title: string;
  content?: string;
  status: string;
  sortOrder: number;
  createdBy?: unknown;
  updatedBy?: unknown;
  publishedAt?: Date | null;
  publishedBy?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocTreeNode extends FlatDocNode {
  children: DocTreeNode[];
}

interface AuthUser {
  _id: Types.ObjectId;
  role: string;
}

function toIdString(id: unknown): string | null {
  if (id == null) return null;
  return String(id);
}

export function buildTreeFromFlatNodes(flatNodes: FlatDocNode[]): DocTreeNode[] {
  const nodeMap = new Map<string, DocTreeNode>();
  const roots: DocTreeNode[] = [];

  for (const node of flatNodes) {
    nodeMap.set(node._id, { ...node, children: [] });
  }

  for (const node of flatNodes) {
    const treeNode = nodeMap.get(node._id);
    if (!treeNode) continue;

    const parentId = toIdString(node.parentId);
    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  const sortChildren = (nodes: DocTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };

  sortChildren(roots);
  return roots;
}

export function filterNodesForMember(flatNodes: FlatDocNode[]): FlatDocNode[] {
  const visibleIds = new Set<string>();

  const publishedDocs = flatNodes.filter(
    (n) => n.type === DOC_NODE_TYPES.DOC && n.status === DOC_STATUS.PUBLISHED
  );

  for (const doc of publishedDocs) {
    visibleIds.add(doc._id);
    let parentId = toIdString(doc.parentId);
    while (parentId) {
      visibleIds.add(parentId);
      const parent = flatNodes.find((n) => n._id === parentId);
      parentId = parent ? toIdString(parent.parentId) : null;
    }
  }

  return flatNodes.filter((n) => visibleIds.has(n._id));
}

export function pruneEmptyFolders(tree: DocTreeNode[]): DocTreeNode[] {
  return tree
    .map((node) => {
      if (node.type === DOC_NODE_TYPES.FOLDER) {
        const children = pruneEmptyFolders(node.children);
        return { ...node, children };
      }
      return node;
    })
    .filter(
      (node) =>
        node.type === DOC_NODE_TYPES.DOC ||
        (node.type === DOC_NODE_TYPES.FOLDER && node.children.length > 0)
    );
}

function serializeNode(node: Record<string, unknown>): FlatDocNode {
  return {
    _id: String(node._id),
    type: String(node.type),
    parentId: toIdString(node.parentId),
    title: String(node.title),
    content: node.content != null ? String(node.content) : "",
    status: String(node.status),
    sortOrder: Number(node.sortOrder ?? 0),
    createdBy: node.createdBy,
    updatedBy: node.updatedBy,
    publishedAt: node.publishedAt as Date | null | undefined,
    publishedBy: node.publishedBy,
    createdAt: node.createdAt as Date | undefined,
    updatedAt: node.updatedAt as Date | undefined,
  };
}

function isAdmin(user: AuthUser): boolean {
  return user.role === userRoles.ADMIN;
}

async function getNextSortOrder(parentId: Types.ObjectId | null): Promise<number> {
  const last = await DocNode.findOne({ parentId })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();

  return last ? last.sortOrder + 1 : 0;
}

async function validateParentId(
  parentId: string | null | undefined,
  excludeId?: string
): Promise<Types.ObjectId | null> {
  if (!parentId) return null;

  const parent = await DocNode.findById(parentId);
  if (!parent) {
    throw createHttpError(404, "Parent folder not found");
  }
  if (parent.type !== DOC_NODE_TYPES.FOLDER) {
    throw createHttpError(400, "Parent must be a folder");
  }
  if (excludeId && parentId === excludeId) {
    throw createHttpError(400, "Node cannot be its own parent");
  }

  return parent._id as Types.ObjectId;
}

async function assertNoChildren(nodeId: string): Promise<void> {
  const childCount = await DocNode.countDocuments({ parentId: nodeId });
  if (childCount > 0) {
    throw createHttpError(409, "Cannot delete a folder that contains items");
  }
}

export async function getDocTree(user: AuthUser) {
  const nodes = await DocNode.find()
    .sort({ sortOrder: 1, title: 1 })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();

  let flatNodes = nodes.map((n) => serializeNode(n as Record<string, unknown>));

  if (!isAdmin(user)) {
    flatNodes = filterNodesForMember(flatNodes);
  }

  const tree = buildTreeFromFlatNodes(flatNodes);

  if (!isAdmin(user)) {
    return pruneEmptyFolders(tree);
  }

  return tree;
}

export async function getDocById(id: string, user: AuthUser) {
  const node = await DocNode.findById(id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();

  if (!node) {
    throw createHttpError(404, "Document not found");
  }

  if (
    !isAdmin(user) &&
    node.type === DOC_NODE_TYPES.DOC &&
    node.status !== DOC_STATUS.PUBLISHED
  ) {
    throw createHttpError(404, "Document not found");
  }

  return node;
}

export async function createFolder(
  user: AuthUser,
  data: { title: string; parentId?: string | null }
) {
  const parentId = await validateParentId(data.parentId);
  const sortOrder = await getNextSortOrder(parentId);

  const folder = await DocNode.create({
    type: DOC_NODE_TYPES.FOLDER,
    parentId,
    title: data.title.trim(),
    content: "",
    status: DOC_STATUS.PUBLISHED,
    sortOrder,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return DocNode.findById(folder._id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();
}

export async function createDoc(
  user: AuthUser,
  data: { title: string; parentId?: string | null; content?: string }
) {
  const parentId = await validateParentId(data.parentId);
  const sortOrder = await getNextSortOrder(parentId);

  const doc = await DocNode.create({
    type: DOC_NODE_TYPES.DOC,
    parentId,
    title: data.title.trim(),
    content: data.content ?? "",
    status: DOC_STATUS.DRAFT,
    sortOrder,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return DocNode.findById(doc._id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();
}

export async function updateDocNode(
  user: AuthUser,
  id: string,
  data: {
    title?: string;
    content?: string;
    parentId?: string | null;
    sortOrder?: number;
  }
) {
  const node = await DocNode.findById(id);
  if (!node) {
    throw createHttpError(404, "Document not found");
  }

  if (data.title != null) {
    node.title = data.title.trim();
  }

  if (data.content != null && node.type === DOC_NODE_TYPES.DOC) {
    node.content = data.content;
  }

  if (data.sortOrder != null) {
    node.sortOrder = data.sortOrder;
  }

  if (data.parentId !== undefined) {
    const newParentId = await validateParentId(data.parentId, id);
    node.set("parentId", newParentId);
  }

  node.updatedBy = user._id;
  await node.save();

  return DocNode.findById(node._id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();
}

export async function publishDocNode(user: AuthUser, id: string) {
  const node = await DocNode.findById(id);
  if (!node) {
    throw createHttpError(404, "Document not found");
  }
  if (node.type !== DOC_NODE_TYPES.DOC) {
    throw createHttpError(400, "Only documents can be published");
  }

  node.status = DOC_STATUS.PUBLISHED;
  node.publishedAt = new Date();
  node.publishedBy = user._id;
  node.updatedBy = user._id;
  await node.save();

  return DocNode.findById(node._id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();
}

export async function unpublishDocNode(user: AuthUser, id: string) {
  const node = await DocNode.findById(id);
  if (!node) {
    throw createHttpError(404, "Document not found");
  }
  if (node.type !== DOC_NODE_TYPES.DOC) {
    throw createHttpError(400, "Only documents can be unpublished");
  }

  node.status = DOC_STATUS.DRAFT;
  node.updatedBy = user._id;
  await node.save();

  return DocNode.findById(node._id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();
}

export async function deleteDocNode(id: string) {
  const node = await DocNode.findById(id);
  if (!node) {
    throw createHttpError(404, "Document not found");
  }

  if (node.type === DOC_NODE_TYPES.FOLDER) {
    await assertNoChildren(id);
  }

  await DocNode.findByIdAndDelete(id);
  return { _id: id };
}
