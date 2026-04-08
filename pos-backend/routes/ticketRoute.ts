import express from "express";
import {
    getTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketSummary,
    getMyTickets
} from "../controllers/ticketController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext, isStoreRole } from "../middlewares/storeContext.js";

const router = express.Router();

// Any store member can view their own tickets
router.get("/my-tickets", isVerifiedUser, storeContext, getMyTickets);

// Owner/Manager/Admin only
router.get("/summary",    isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), getTicketSummary);
router.route("/")
    .get( isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), getTickets)
    .post(isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), createTicket);
router.route("/:id")
    .put(   isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), updateTicket)
    .delete(isVerifiedUser, storeContext, isStoreRole("Owner", "Manager"), deleteTicket);

export default router;
