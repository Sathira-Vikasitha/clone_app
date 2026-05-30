import type { Request, Response } from "express";
import { z } from "zod";
import {
  createDemoCardPurchase,
  createStoreItem,
  deleteStoreItemForSeller,
  getMyPurchases,
  getMyStoreItems,
  getSellerPurchaseRequests,
  getStoreItemById,
  getStoreItems,
  recordStoreDownload,
  submitReceiptPurchase,
  updateStoreItemForSeller,
  updatePurchaseStatus,
} from "./store.service.js";

const storeItemSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.string().min(1).max(40).default("Other"),
  imageUrl: z.string().url(),
  priceAmount: z.number().int().min(1),
  currency: z.string().min(3).max(5).default("LKR"),
});

const receiptPurchaseSchema = z.object({
  receiptUrl: z.string().url(),
});

function mapStoreItem(item: any, currentUserId: string) {
  const purchase = item.purchases?.[0] || null;

  return {
    ...item,
    purchase,
    canDownload:
      item.sellerId === currentUserId ||
      purchase?.status === "approved" ||
      purchase?.status === "paid",
    downloadCount: item._count?.downloads || 0,
    purchases: undefined,
    _count: undefined,
  };
}

export async function create(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const body = storeItemSchema.parse(req.body);
    const itemData: {
      sellerId: string;
      title: string;
      imageUrl: string;
      priceAmount: number;
      currency: string;
      category: string;
      description?: string;
    } = {
      sellerId: userId,
      title: body.title,
      category: body.category,
      imageUrl: body.imageUrl,
      priceAmount: body.priceAmount,
      currency: body.currency.toUpperCase(),
    };

    if (body.description) {
      itemData.description = body.description;
    }

    const item = await createStoreItem(itemData);

    return res.status(201).json(mapStoreItem(item, userId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Create store item failed" });
  }
}

export async function list(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const items = await getStoreItems(userId, query, category);

  return res.json(items.map((item) => mapStoreItem(item, userId)));
}

export async function mine(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const items = await getMyStoreItems(userId);

  return res.json(items.map((item) => mapStoreItem(item, userId)));
}

export async function show(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const itemId = req.params.itemId;

  if (!itemId || Array.isArray(itemId)) {
    return res.status(400).json({ message: "Store item id is required" });
  }

  const item = await getStoreItemById(itemId, userId);

  if (!item) {
    return res.status(404).json({ message: "Store item not found" });
  }

  return res.json(mapStoreItem(item, userId));
}

export async function update(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const itemId = req.params.itemId;
    const body = storeItemSchema.parse(req.body);

    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ message: "Store item id is required" });
    }

    const itemData: {
      itemId: string;
      sellerId: string;
      title: string;
      imageUrl: string;
      priceAmount: number;
      currency: string;
      category: string;
      description?: string;
    } = {
      itemId,
      sellerId: userId,
      title: body.title,
      category: body.category,
      imageUrl: body.imageUrl,
      priceAmount: body.priceAmount,
      currency: body.currency.toUpperCase(),
    };

    if (body.description) {
      itemData.description = body.description;
    }

    const item = await updateStoreItemForSeller(itemData);

    if (!item) {
      return res.status(404).json({ message: "Store item not found" });
    }

    return res.json(mapStoreItem(item, userId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Update store item failed" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const itemId = req.params.itemId;

    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ message: "Store item id is required" });
    }

    const deleted = await deleteStoreItemForSeller(itemId, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Store item not found" });
    }

    return res.json({ deleted: true });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Delete store item failed" });
  }
}

export async function receiptPurchase(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const itemId = req.params.itemId;
    const body = receiptPurchaseSchema.parse(req.body);

    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ message: "Store item id is required" });
    }

    const purchase = await submitReceiptPurchase({
      itemId,
      buyerId: userId,
      receiptUrl: body.receiptUrl,
    });

    return res.status(201).json(purchase);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Receipt payment failed" });
  }
}

export async function demoCardPurchase(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const itemId = req.params.itemId;

    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ message: "Store item id is required" });
    }

    const purchase = await createDemoCardPurchase({
      itemId,
      buyerId: userId,
    });

    return res.status(201).json({
      ...purchase,
      message: "Demo card payment marked as paid. Replace this with PayHere/Stripe gateway verification before production.",
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Card payment failed" });
  }
}

export async function download(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const itemId = req.params.itemId;

    if (!itemId || Array.isArray(itemId)) {
      return res.status(400).json({ message: "Store item id is required" });
    }

    const downloadData = await recordStoreDownload({ itemId, userId });

    return res.json(downloadData);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Download failed" });
  }
}

export async function myPurchases(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const purchases = await getMyPurchases(userId);

  return res.json(purchases);
}

export async function sellerRequests(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const purchases = await getSellerPurchaseRequests(userId);

  return res.json(purchases);
}

export async function approve(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const purchaseId = req.params.purchaseId;

    if (!purchaseId || Array.isArray(purchaseId)) {
      return res.status(400).json({ message: "Purchase id is required" });
    }

    const purchase = await updatePurchaseStatus({
      purchaseId,
      sellerId: userId,
      status: "approved",
    });

    return res.json(purchase);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Approve failed" });
  }
}

export async function reject(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const purchaseId = req.params.purchaseId;

    if (!purchaseId || Array.isArray(purchaseId)) {
      return res.status(400).json({ message: "Purchase id is required" });
    }

    const purchase = await updatePurchaseStatus({
      purchaseId,
      sellerId: userId,
      status: "rejected",
    });

    return res.json(purchase);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Reject failed" });
  }
}
