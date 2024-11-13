import * as express from "express";

// Controllers
import { createMember, createAdmin, createPlan } from "../controller/adminController";

// middleware
import { verifyAdmin } from "../middleware/verifier/verifyAdmin";
import { validate } from "../middleware/validator/index";
import { createAdminSchema } from "../middleware/validator/schema/adminSchema";
import { createPlanSchema } from "../middleware/validator/schema/createPlanSchema";
import { createMemberSchema } from "../middleware/validator/schema/createMemberSchema";

const router = express.Router();

/** routes

 * remove @method verifyAdmin middleware from routes 
   for testing or create new admin for development
 
 */

router.post("/create", validate(createAdminSchema), verifyAdmin, createAdmin);
router.post("/add-plan", validate(createPlanSchema), createPlan);
router.post("/add-member", validate(createMemberSchema), createMember);


// export
export default router;