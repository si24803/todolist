import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: [true, "Task title required"] },
    description: { type: String, required: false },
    assignee: { type: Schema.Types.ObjectId, ref: "User", required: [true, "Assignee required"] },
    complete: { type: Boolean, required: true, default: false },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: [true, "Project required"] },
    deleted: { type: Boolean, default: false, required: true },
  },
  { autoCreate: true, timestamps: true, autoIndex: true, validateBeforeSave: true, strict: true }
);

taskSchema.index({ title: 1, project: 1, deleted: 1 }, { unique: true });

export default model("Task", taskSchema);
exports.taskSchema = taskSchema;
