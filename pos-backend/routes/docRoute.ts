import express from "express";
import {
  createDocHandler,
  createFolderHandler,
  deleteHandler,
  getById,
  getTree,
  publishHandler,
  unpublishHandler,
  updateHandler,
} from "../controllers/docController.js";
import { isAdmin, isVerifiedUser } from "../middlewares/tokenVerification.js";

const router = express.Router();

router.route("/tree").get(isVerifiedUser, getTree);

router.route("/folder").post(isVerifiedUser, isAdmin, createFolderHandler);

router.route("/").post(isVerifiedUser, isAdmin, createDocHandler);

router
  .route("/:id/publish")
  .patch(isVerifiedUser, isAdmin, publishHandler);

router
  .route("/:id/unpublish")
  .patch(isVerifiedUser, isAdmin, unpublishHandler);

router
  .route("/:id")
  .get(isVerifiedUser, getById)
  .put(isVerifiedUser, isAdmin, updateHandler)
  .delete(isVerifiedUser, isAdmin, deleteHandler);

export default router;
