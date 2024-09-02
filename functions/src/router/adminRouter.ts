import * as express from "express";

// Controllers
import { createAdmin } from "../controller/adminController";

// middleware
// import { verifyAdmin } from "../middleware/verifier/verifyAdmin";
import { validate } from "../middleware/validator/index";
import { createAdminSchema } from "../middleware/validator/schema/adminSchema";

const router = express.Router();


/** routes

 * remove @method verifyAdmin middleware from routes 
   for testing or create new admin for development
 
 */

router.post("/create", validate(createAdminSchema), createAdmin);


// export
export default router;