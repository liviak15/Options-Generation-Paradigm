import { Schema, model } from "mongoose";

const schema = new Schema( // how entries are saved in the db
  {
    athleteId:  { type: String, required: true },
    videoId:    { type: String, required: true },
    transcript: { type: String, required: true },
    expertScore:{ type: Number, default: null },
    autoScore:  { type: Number, default: null }
  },
  { timestamps: true }
);

export default model("Response", schema);
