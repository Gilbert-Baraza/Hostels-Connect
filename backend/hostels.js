const express = require('express');
const router = express.Router();
const Hostel = require('./Hostel'); // Corrected path
const User = require('./User'); // Import User model
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET api/hostels
// @desc    Get all hostels
// @access  Public
router.get('/', async (req, res) => {
  try {
    const hostels = await Hostel.find();
    res.json(hostels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/hostels
// @desc    Create a hostel
// @access  Public (for landlords)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Hostel image is required.' });
    }

    const { landlordId } = req.body;
    const landlord = await User.findById(req.body.landlordId);

    if (!landlord) {
      return res.status(404).json({ message: 'Landlord not found' });
    }

    // Upload image to Cloudinary
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error || !result) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: 'Image upload failed.' });
      }

      const { name, location, price, roomsAvailable, totalRooms, rulesAndRegulations, paymentFrequency, roomType } = req.body;

      const newHostel = new Hostel({
        name, location, price, roomsAvailable, totalRooms, rulesAndRegulations,
        landlord: landlord.name,
        landlordPhone: landlord.phone,
        landlordId, paymentFrequency, roomType,
        imageUrl: result.secure_url, // Save the image URL from Cloudinary
        approved: true // Or false if you want an approval flow
      });

      const savedHostel = await newHostel.save();
      res.status(201).json(savedHostel);

    }).end(req.file.buffer);
  } catch (err) {
    console.error('Hostel creation error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route   PATCH api/hostels/:id
// @desc    Update a hostel
// @access  Private (landlord or admin)
router.patch('/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!hostel) {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    res.json(hostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/hostels/:id/approve
// @desc    Approve a hostel
// @access  Private (should be protected for admins)
router.patch('/:id/approve', async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!hostel) {
      return res.status(404).json({ msg: 'Hostel not found' });
    }

    res.json(hostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/hostels/:id
// @desc    Delete a hostel
// @access  Private (should be protected for admins)
router.delete('/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndDelete(req.params.id);
    if (!hostel) {
      return res.status(404).json({ msg: 'Hostel not found' });
    }
    res.json({ msg: 'Hostel removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;