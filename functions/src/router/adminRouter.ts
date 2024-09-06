import * as express from "express";

// Controllers
import { createAdmin, createPlan } from "../controller/adminController";

// middleware
import { verifyAdmin } from "../middleware/verifier/verifyAdmin";
import { validate } from "../middleware/validator/index";
import { createAdminSchema } from "../middleware/validator/schema/adminSchema";
import { addPlanSchema } from "../middleware/validator/schema/addPlanSchema";

const router = express.Router();

/** routes

 * remove @method verifyAdmin middleware from routes 
   for testing or create new admin for development
 
 */

router.post("/create", validate(createAdminSchema), verifyAdmin, createAdmin);
router.post("/add-plan", validate(addPlanSchema), createPlan);


// export
export default router;