import express from "express";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";

import projectsRouter from "./projects";
import User from "../model/user";

const router = express.Router({ mergeParams: true });

/* Manage users. */
router
  .route("/")
  .get(async (req, res, next) => {
    User.find({ deleted: false })
      .exec()
      .then((users) => res.send({ users: users }))
      .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));

    return;
  })
  .post(async (req, res, err) => {
    let newUser = new User(req.body);

    // generate user validation token and password hash
    Promise.all([bcrypt.hash(newUser.username, 2), bcrypt.hash(newUser.password, 2)])
      .then((results) => {
        newUser.validationToken = results[0];
        newUser.password = results[1];

        return Promise.resolve(newUser);
      })
      .then((user) => user.save())
      .then((user) => Promise.resolve(res.status(StatusCodes.ACCEPTED).send(user)))
      .catch((err) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err.code == 11000 ? "username exists" : err })
      );

    return;
  });

router
  .route("/:userid")
  .get(async (req, res, next) => {
    User.findOne({ _id: req.params.userid, deleted: false })
      .populate({ path: "projects", match: { deleted: false } })
      .populate({ path: "projectsCount", match: { deleted: false } })
      .populate({ path: "tasks", match: { completed: false, deleted: false } })
      .populate({ path: "openTasks" })
      .populate({ path: "completedTasks" })
      .exec()
      .then((user) => res.status(StatusCodes.OK).send(user ?? {}))
      .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));

    return;
  })
  .delete(async (req, res, next) => {
    let force = req.body.force ?? false,
      queryPromise = null;

    switch (force) {
      case true:
        queryPromise = User.deleteOne({ _id: req.params.userid }).exec();
        break;
      default:
        queryPromise = User.updateOne({ _id: req.params.userid, deleted: false }, { deleted: true }).exec();
        break;
    }

    if (queryPromise)
      queryPromise
        .then((user) => {
          res.status(StatusCodes.ACCEPTED).send(user);
        })
        .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));

    return;
  });

// confirm user registration
router.get("/:userid/confirm/:validationToken", async (req, res, next) => {
  User.findOne({ _id: req.params.userid, validationToken: req.params.validationToken, validated: false })
    .exec()
    .then(async (user) => {
      if (user !== null) {
        user.validated = true;
        User.updateOne({ _id: user.id }, { validated: true }).exec();
      } else throw new Error("Unvalidated user not found");
    })
    .then((_) => res.sendStatus(StatusCodes.ACCEPTED))
    .catch((err) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: err }));

  return;
});

// User login
router.post("/login", async (req, res, next) => {
  let username = req.body.username;
  let ptPassword = req.body.password;

  User.findOne({ username: username, deleted: false })
    .exec()
    .then(async (user) => {
      console.debug(`user: ${user}`);
      if (!user) throw new Error("Bad username or password");

      let passMatch = await bcrypt.compare(ptPassword, user.password);

      // if res == true, password matched
      if (passMatch !== true) throw new Error("Bad username or password");

      return user;
    })
    .populate()
    .execPopulate()
    .then((user) => User.updateOne({ _id: user._id }, { lastLogin: Date.now() }).exec())
    .then((user) =>
      res.status(OK).send({ user: { username: user.username, name: user.name, projects: user.projects } })
    )
    .catch((err) => res.status(StatusCodes.UNAUTHORIZED).send({ message: err }));

  return;
});

router.use("/:userid/projects", projectsRouter);

export default router;
