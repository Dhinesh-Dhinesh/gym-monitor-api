import * as express from "express";

// Controllers
import { createMember, createAdmin, createPlan, addPayment, deletePayment } from "../controller/adminController";

// middleware
import { verifyAdmin } from "../middleware/verifier/verifyAdmin";
import { validate } from "../middleware/validator/index";
import { createAdminSchema } from "../middleware/validator/schema/adminSchema";
import { createPlanSchema } from "../middleware/validator/schema/createPlanSchema";
import { createMemberSchema } from "../middleware/validator/schema/createMemberSchema";
import { addPaymentSchema } from "../middleware/validator/schema/addPaymentSchema";
import { deletePaymentSchema } from "../middleware/validator/schema/deletePayment";

const router = express.Router();

/** routes

 * remove @method verifyAdmin middleware from routes 
   for testing or create new admin for development
 
 */

router.post("/create", validate(createAdminSchema), verifyAdmin, createAdmin);
router.post("/add-plan", validate(createPlanSchema), verifyAdmin, createPlan);
router.post("/add-member", validate(createMemberSchema), verifyAdmin, createMember);
router.post("/add-payment", validate(addPaymentSchema), verifyAdmin, addPayment);
router.post("/delete-payment", validate(deletePaymentSchema), verifyAdmin, deletePayment);


// export
export default router;