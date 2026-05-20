import createHttpError from "http-errors";
import {
  createDoc,
  createFolder,
  deleteDocNode,
  getDocById,
  getDocTree,
  publishDocNode,
  unpublishDocNode,
  updateDocNode,
} from "../services/docService.js";

const getTree = async (req, res, next) => {
  try {
    const tree = await getDocTree(req.user);
    res.status(200).json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const node = await getDocById(id, req.user);
    res.status(200).json({ success: true, data: node });
  } catch (error) {
    next(error);
  }
};

const createFolderHandler = async (req, res, next) => {
  try {
    const { title, parentId } = req.body;

    if (!title || !String(title).trim()) {
      return next(createHttpError(400, "Title is required"));
    }

    const folder = await createFolder(req.user, { title, parentId });
    res.status(201).json({
      success: true,
      message: "Folder created",
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

const createDocHandler = async (req, res, next) => {
  try {
    const { title, parentId, content } = req.body;

    if (!title || !String(title).trim()) {
      return next(createHttpError(400, "Title is required"));
    }

    const doc = await createDoc(req.user, { title, parentId, content });
    res.status(201).json({
      success: true,
      message: "Document created",
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, parentId, sortOrder } = req.body;

    const node = await updateDocNode(req.user, id, {
      title,
      content,
      parentId,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: "Document updated",
      data: node,
    });
  } catch (error) {
    next(error);
  }
};

const publishHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const node = await publishDocNode(req.user, id);
    res.status(200).json({
      success: true,
      message: "Document published",
      data: node,
    });
  } catch (error) {
    next(error);
  }
};

const unpublishHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const node = await unpublishDocNode(req.user, id);
    res.status(200).json({
      success: true,
      message: "Document unpublished",
      data: node,
    });
  } catch (error) {
    next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteDocNode(req.user, id);
    res.status(200).json({
      success: true,
      message: "Deleted successfully",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getTree,
  getById,
  createFolderHandler,
  createDocHandler,
  updateHandler,
  publishHandler,
  unpublishHandler,
  deleteHandler,
};
