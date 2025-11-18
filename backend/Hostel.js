const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  name: { // Changed from hostelName for consistency
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  roomsAvailable: {
    type: Number,
    required: true
  },
  totalRooms: {
    type: Number,
    required: true
  },
  landlord: {
    type: String,
    required: true
  },
  landlordId: {
    type: String,
    required: true
  },
  approved: {
    type: Boolean,
    default: true
  },
   imageUrl: {
    type: String
  },
  paymentFrequency: {
    type: String,
    enum: ['monthly', 'semester'],
  },
   roomType: {
    type: String,
    enum: ['single', 'double', 'self-contained'],
  },
  rulesAndRegulations: {
    type: String,
  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.model('Hostel', HostelSchema);