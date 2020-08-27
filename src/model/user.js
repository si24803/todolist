import { Schema, model } from "mongoose";
import validator from "validator";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      validate: {
        validator: (v) => {
          return validator.isEmail(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
      required: [true, "Username required"],
      unique: true,
    },
    password: { type: String, required: true },
    //completedTaskCount: { type: Number, required: true, default: 0 },
    //todoTaskCount: { type: Number, required: true, default: 0 },
    //projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    //tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    deleted: { type: Boolean, required: true, default: false },
    validated: { type: Boolean, required: true, default: false },
    lastLogin: { type: Date },
    validationToken: { type: String, required: true },
  },
  {
    autoCreate: true,
    timestamps: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    validateBeforeSave: true,
    strict: true,
  }
);

userSchema.virtual("projects", { ref: "Project", localField: "_id", foreignField: "owner", match: { deleted: false } });
userSchema.virtual("projectsCount", {
  ref: "Project",
  localField: "_id",
  foreignField: "owner",
  count: true,
  match: { deleted: false },
});
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "assignee",
  count: true,
  match: { deleted: false },
});
userSchema.virtual("openTasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "assignee",
  count: true,
  match: { deleted: false, completed: false },
});
userSchema.virtual("completedTasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "assignee",
  count: true,
  match: { deleted: false, completed: true },
});

export default model("User", userSchema);
exports.userSchema = userSchema;
