import path from "path";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import logger from "morgan";
import httpCodes from "http-status-codes";
import mongoose from "mongoose";
import createError from "http-errors";
import usersRouter from "./routes/users";

// Connect to MongoDB
let isMongoConnected = false;
mongoose
  .connect("mongodb://localhost:27017/todolist", { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: true })
  .then((conn) => {
    isMongoConnected = true;
    console.info("Mongo connected");
  })
  .catch((err) => console.error(err));
mongoose.set("debug", true);

// Create global app object
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// Set various HTTP headers to help protect your app.
app.use(helmet());

// Serve images, CSS files, HTML and JavaScript files in a directory named public.
app.use("/static", express.static(path.join(__dirname, "../public")));

app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// parse application/json
app.use(express.json());

// Routes
app.use("/users", usersRouter);

app.get("/", (req, res) => {
  res.redirect("/static/index.html");
});

//app.use(express.static(path.join(__dirname, 'public')));

//app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//module.exports = app;

export default app;
