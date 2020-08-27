import { Schema, model } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    deleted: { type: Boolean, default: false, required: true },
  },
  { autoCreate: true, timestamps: true, autoIndex: true, validateBeforeSave: true, strict: true }
);

projectSchema.index({ title: 1, owner: 1, deleted: 1 }, { unique: true });

projectSchema.virtual("tasks", { ref: "Task", localField: "_id", foreignField: "project" });
projectSchema.virtual("tasksCount", { ref: "Task", localField: "_id", foreignField: "project", count: true });

export default model("Project", projectSchema);
exports.projectSchemas = projectSchema;
