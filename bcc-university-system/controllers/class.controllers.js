const User = require("../models/user");
const Class = require("../models/class");
const Course = require("../models/course");

exports.getClass = async (req, res) => {
  let classes = await Class.find({})
    .sort({ _course: 1, name: 1 })
    .select("-_student")
    .populate("_course", "name sks -_id");

  if (req.query.courseId) {
    if (req.query.courseId.match(/^[0-9a-fA-F]{24}$/)) {
      classes = await Class.find({ _course: req.query.courseId })
        .sort({ _course: 1, name: 1 })
        .select("-_student")
        .populate("_course", "name sks -_id");
    } else {
      return res
        .status(404)
        .json({ error: true, message: "Class is Not Found" });
    }
  }

  if (!classes) {
    return res.status(404).json({ error: true, message: "Class is Not Found" });
  }

  try {
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ error: true, message: error });
  }
};

exports.addClass = async (req, res) => {
  const classFound = await Class.findOne({ name: req.body.name });

  if (classFound) {
    return res
      .status(400)
      .json({ error: true, message: "Class is already created" });
  }

  let classVar;

  if (req.body.courseId.match(/^[0-9a-fA-F]{24}$/)) {
    classVar = await Class.create({
      name: req.body.name,
      _course: req.body.courseId,
    });
  } else {
    return res
      .status(404)
      .json({ error: true, message: "Course is Not Found" });
  }

  try {
    await classVar.save();
    await Course.findByIdAndUpdate(classVar._course, {
      $addToSet: { _class: classVar._id },
    });
    res.status(201).json({identityNumber: classVar._id});
  } catch (error) {
    res.status(400).json({ error: true, message: error });
  }
};

exports.updateClass = async (req, res) => {
  let classFound;

  if (req.params.classId.match(/^[0-9a-fA-F]{24}$/)) {
    classFound = await Class.findOne({ _id: req.params.classId });
  } else {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (!classFound) {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (req.body.name) {
    await Class.findByIdAndUpdate(req.params.classId, {
      name: req.body.name,
    });
  } else if (req.body.courseId) {
    await Class.findByIdAndUpdate(req.params.classId, {
      _course: req.body.courseId,
    });
  } else {
    res.status(400).json({ error: true, message: "Nothing changed" });
  }

  res.status(200).json({ message: "successfully edited" });
};

exports.deleteClass = async (req, res) => {
  let classVar;

  if (req.params.classId.match(/^[0-9a-fA-F]{24}$/)) {
    classVar = await Class.findOne({ _id: req.params.classId });
  } else {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (!classVar) {
    return res.status(404).json({
      error: true,
      message: "Class is not found",
    });
  }

  try {
    await User.findOneAndUpdate(
      { _class: req.params.classId },
      { $pull: { _class: req.params.classId } }
    );
    await Course.findOneAndUpdate(
      { _class: req.params.classId },
      { $pull: { _class: req.params.classId } }
    );
    await Class.deleteOne({ _id: req.params.classId });
    res.status(200).json({ message: "successfully deleted" });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: error,
    });
  }
};

exports.addNewUser = async (req, res) => {
  let classFound;
  let userFound;

  if (req.params.classId.match(/^[0-9a-fA-F]{24}$/)) {
    classFound = await Class.findById(req.params.classId);
  } else {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (!classFound) {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (req.body.userId.match(/^[0-9a-fA-F]{24}$/)) {
    userFound = await User.findById(req.body.userId);
  } else {
    return res.status(404).json({ error: true, message: "User is not found" });
  }

  if (!userFound) {
    return res.status(404).json({ error: true, message: "User is not found" });
  }

  try {
    await User.updateOne(
      { _id: req.body.userId },
      {
        $addToSet: { _class: req.params.classId },
      }
    );
    await Class.updateOne(
      { _id: req.params.classId },
      {
        $addToSet: { _student: req.body.userId },
      }
    );

    res.status(200).json({ message: "successfully added new user" });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: error,
    });
  }
};

exports.deleteUser = async (req, res) => {
  let classFound;
  let userFound;

  if (req.params.classId.match(/^[0-9a-fA-F]{24}$/)) {
    classFound = await Class.findById(req.params.classId);
  } else {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (!classFound) {
    return res.status(404).json({ error: true, message: "Class is not found" });
  }

  if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
    userFound = await User.findById(req.params.studentId);
  } else {
    return res.status(404).json({ error: true, message: "User is not found" });
  }

  if (!userFound) {
    return res.status(404).json({ error: true, message: "User is not found" });
  }

  try {
    await User.findByIdAndUpdate(req.params.studentId, {
      $pull: { _class: req.body.classId },
    });
    await Class.findByIdAndUpdate(req.params.classId, {
      $pull: { _student: req.params.studentId },
    });

    res.status(200).json({ message: "successfully deleted an user" });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: error,
    });
  }
};
