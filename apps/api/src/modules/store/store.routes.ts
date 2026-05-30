import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  approve,
  create,
  demoCardPurchase,
  download,
  list,
  mine,
  myPurchases,
  receiptPurchase,
  reject,
  remove,
  sellerRequests,
  show,
  update,
} from "./store.controller.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.get("/mine", requireAuth, mine);
router.get("/purchases", requireAuth, myPurchases);
router.get("/seller/requests", requireAuth, sellerRequests);
router.get("/:itemId", requireAuth, show);
router.patch("/:itemId", requireAuth, update);
router.delete("/:itemId", requireAuth, remove);
router.post("/:itemId/download", requireAuth, download);
router.post("/:itemId/purchase/receipt", requireAuth, receiptPurchase);
router.post("/:itemId/purchase/card-demo", requireAuth, demoCardPurchase);
router.patch("/purchases/:purchaseId/approve", requireAuth, approve);
router.patch("/purchases/:purchaseId/reject", requireAuth, reject);

export default router;
