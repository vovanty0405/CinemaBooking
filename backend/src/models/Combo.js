const mongoose = require('mongoose')

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  items: [{
    itemName: { type: String },   
    quantity: { type: Number, default: 1 },
  }],
  originalPrice: { type: Number, required: true },  
  comboPrice: { type: Number, required: true },      
  savingPercent: { type: Number },                   
  applicableCinemaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cinema' }], 
  isFeaturedOnHome: { type: Boolean, default: false },
  tagLabel: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  stockLimit: { type: Number, default: null },       
}, { timestamps: true })

// Middleware to calculate savingPercent before save
comboSchema.pre('save', function (next) {
  if (this.originalPrice > 0 && this.comboPrice <= this.originalPrice) {
    this.savingPercent = Math.round((1 - this.comboPrice / this.originalPrice) * 100);
  } else {
    this.savingPercent = 0;
  }
  next();
});

module.exports = mongoose.model('Combo', comboSchema)
