import express from "express";
import { ACCEPTED, INTERNAL_SERVER_ERROR } from "http-status-codes";
import Project from "../model/project";
import taskRouter from "./tasks";

// from users router
const router = express.Router({ mergeParams: true });

/* GET project listing for a user. */
router
  .route("/")
  .get(async (req, res, next) => {
    let userid = req.params.userid;

    Project.find({ owner: userid, deleted: false }, (err, docs) => {
      if (err) return res.status(INTERNAL_SERVER_ERROR).send({ message: err });

      return res.send({ projects: docs });
    });

    return;
  })
  .post(async (req, res, next) => {
    let project = new Project(req.body);
    project.owner = req.params.userid;
    project.members = [project.owner];

    project.save((err, project) => {
      if (err) return res.status(INTERNAL_SERVER_ERROR).send({ message: err });

      return res.status(ACCEPTED).send(project);
    });
  });

router
  .route("/:projectid")
  .get(async (req, res, next) => {
    let project = null;

    project = await Project.findOne({ _id: req.params.projectid, deleted: false })
      .populate("owner", "username")
      .populate("members", "username")
      .populate("tasks", "title")
      .then((populated) => res.send({ project: populated }))
      .catch((err) => res.status(INTERNAL_SERVER_ERROR).send({ message: err }));

    return;
  })
  .patch(async (req, res, next) => {
    Project.updateOne({ _id: req.params.projectid, deleted: false }, req.body)
      .exec()
      .catch((err) => console.error(err));

    return res.sendStatus(ACCEPTED);
  })
  .delete(async (req, res, next) => {
    let action = null;

    switch (req.body.force) {
      case true:
        action = Project.deleteOne({ _id: req.params.projectid, deleted: false });
        break;
      default:
        action = Project.updateOne({ _id: req.params.projectid, deleted: false }, { deleted: true });
        break;
    }

    action.exec().catch((err) => console.error(err));

    return res.sendStatus(ACCEPTED);
  });

router
  .route("/:projectid/members")
  .get(async (req, res, next) => {
    Project.findOne({ _id: req.params.projectid })
      .populate("members")
      .then((project) => res.send({ members: project.members }));

    return;
  })
  .post(async (req, res, next) => {
    let memberid = req.body.member;
    Project.findOne({ _id: req.params.projectid })
      .populate("members")
      .then((project) => project.members.push(memberid))
      .then((project) => Project.updateOne(project))
      .catch((err) => console.error(err));
    return res.sendStatus(ACCEPTED);
  });

router.use("/:projectid/tasks", taskRouter);

export default router;
