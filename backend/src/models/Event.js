const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  shortDescription: { type: String, maxlength: 200 },

  thumbnailUrl: { type: String, required: true },
  bannerUrl: { type: String, default: "" },

  content: { type: String, required: true },

  category: {
    type: String,
    enum: ["promotion", "membership", "news", "seasonal"],
    default: "promotion",
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  isFeatured: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },

  viewCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

eventSchema.index({ status: 1, startDate: -1 });

module.exports = mongoose.model('Event', eventSchema);
