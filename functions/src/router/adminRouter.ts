import * as express from "express";

// Controllers
import { addMember, createAdmin, createPlan } from "../controller/adminController";

// middleware
import { verifyAdmin } from "../middleware/verifier/verifyAdmin";
import { validate } from "../middleware/validator/index";
import { createAdminSchema } from "../middleware/validator/schema/adminSchema";
import { addPlanSchema } from "../middleware/validator/schema/addPlanSchema";
import { addMemberSchema } from "../middleware/validator/schema/addMemberSchema";

const router = express.Router();

/** routes

 * remove @method verifyAdmin middleware from routes 
   for testing or create new admin for development
 
 */

router.post("/create", validate(createAdminSchema), verifyAdmin, createAdmin);
router.post("/add-plan", validate(addPlanSchema), createPlan);
router.post("/add-member", validate(addMemberSchema), addMember);


// export
export default router;