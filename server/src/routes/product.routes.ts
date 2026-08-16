import { Router } from "express";

import * as productController from "../controllers/product.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireCompanyScope } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { createProductSchema, updateProductSchema } from "../validators/product.validator";

const router = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", productController.list);

router.post("/", requireRole("BUSINESS_OWNER", "MANAGER"), validateBody(createProductSchema), productController.create);
router.patch(
  "/:id",
  requireRole("BUSINESS_OWNER", "MANAGER"),
  validateBody(updateProductSchema),
  productController.update
);
router.delete("/:id", requireRole("BUSINESS_OWNER", "MANAGER"), productController.remove);

export default router;
