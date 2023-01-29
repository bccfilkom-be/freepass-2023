const express = require("express");
const classController = require("../controllers/class.controllers");
const isAdmin = require("../middleware/admin-auth.middleware");

const router = express.Router();

router.use(isAdmin);

router.route("/").get(classController.getClass).post(classController.addClass);

router
  .route("/:classId")
  .patch(classController.updateClass)
  .delete(classController.deleteClass);

router.post("/:classId/students", classController.addNewUser);
router.delete("/:classId/students/:studentId", classController.deleteUser);

module.exports = router;
