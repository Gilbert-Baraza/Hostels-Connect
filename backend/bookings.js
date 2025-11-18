const express = require('express');
const router = express.Router();
const Booking = require('./Booking');
const Hostel = require('./Hostel'); // Import the Hostel model

// @route   GET api/bookings
// @desc    Get all bookings
// @access  Public (for now, add auth later)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Public (for now, add auth later)
router.post('/', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    const booking = await newBooking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/bookings/:id
// @desc    Update a booking (e.g., approve, reject, cancel)
// @access  Public (add auth later)
router.patch('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/bookings/:id
// @desc    Delete a booking
// @access  Public (add auth later)
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/bookings/:id/cancel
// @desc    Cancel a booking and update hostel roomsAvailable
// @access  Public (add auth later)
router.patch('/:id/cancel', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ msg: 'Booking not found' });

        const hostel = await Hostel.findById(booking.hostelId);
        if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });

        hostel.roomsAvailable = (hostel.roomsAvailable || 0) + 1;
        await hostel.save();

        booking.status = 'cancelled';
        await booking.save();

        res.json({ msg: 'Booking cancelled and hostel updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;