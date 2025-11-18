const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  hostelId: {
    type: String,
    required: true
  },
  hostelName: {
    type: String,
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
  student: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);