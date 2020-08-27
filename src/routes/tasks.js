import express from "express";
import httpStatusCodes, { StatusCodes } from "http-status-codes";
import Task from "../model/task";
import Project from "../model/project";
import User from "../model/user";

const router = express.Router({ mergeParams: true });

/* GET tasks listing for a user project. */
router
  .route("/")
  .get(async (req, res, next) => {
    Task.find({ project: req.params.projectid })
      .exec()
      .then((tasks) => res.send({ tasks: tasks }))
      .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));
  })
  .post(async (req, res, next) => {
    let task = new Task(req.body);
    task.project = req.params.projectid;

    let user = await User.findOne({ username: req.body.assignTo })
      .exec()
      .then((user) => (task.assignee = user ?? req.params.userid))
      .then((_) =>
        task
          .save()
          .then((t) => res.send({ task: t }))
          .catch((err) => Promise.reject(err))
      )
      .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));
  });

router
  .route("/:taskid")
  .get(async (req, res, next) => {
    Task.findOne({ _id: req.params.taskid, deleted: false })
      .populate("project")
      .populate("assignedTo")
      .exec()
      .then((task) => res.send(task))
      .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ msg: err }));
  })
  .patch(async (req, res, next) => {
    Task.updateOne({ _id: req.params.taskid }, req.body)
      .exec()
      .then((updt) => res.send({ result: updt }))
      .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));
  })
  .delete(async (req, res, next) => {
    Task.deleteOne({ _id: req.params.taskid }).exec();

    return res.sendStatus(StatusCodes.ACCEPTED);
  });

router.put("/:taskid/reassign", async (req, res, next) => {
  let userid = req.params.userid,
    projectid = req.params.projectid,
    taskid = req.params.taskid,
    newAssignee = req.body.assignTo;

  let updateCmd = () => Task.updateOne({ _id: taskid }, { assignee: newAssignee });

  Project.findOne({ _id: projectid })
    .exec()
    .then((project) => {
      // if user is not project owner, he must have been assigned the task
      if (project.owner._id === userid) updateCmd();
      else
        Task.findOne({ _id: req.params.taskid, project: projectid, assignee: userid })
          .exec()
          .then((task) => {
            if (task.assignee === userid) updateCmd();
          });
    })
    .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));
});

router.put("/:taskid/complete", async (req, res, next) => {
  let userid = req.params.userid,
    projectid = req.params.projectid,
    taskid = req.params.taskid;

  let updateCmd = () => Task.updateOne({ _id: taskid }, { complete: true });

  Project.findOne({ _id: projectid })
    .exec()
    .then((project) => {
      // if user is not project owner, he must have been assigned the task to complete
      if (project.owner._id === userid) updateCmd();
      else
        Task.findOne({ _id: req.params.taskid, project: projectid, assignee: userid })
          .exec()
          .then((task) => {
            if (task.assignee === userid) updateCmd();
          });
    })
    .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));

  Task.findOne();
});

export default router;
