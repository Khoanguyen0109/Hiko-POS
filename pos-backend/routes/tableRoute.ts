import express from "express";
import { addTable, getTables, updateTable } from "../controllers/tableController.js";
const router = express.Router();
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";
 
router.route("/").post(isVerifiedUser, storeContext, addTable);
router.route("/").get(isVerifiedUser, storeContext, getTables);
router.route("/:id").put(isVerifiedUser, storeContext, updateTable);

export default router;