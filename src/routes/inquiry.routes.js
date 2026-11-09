const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

function normalizeText(value, field, maxLength, { required = false, multiline = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw Object.assign(new Error(`${field} is required.`), { status: 400, validationError: true });
    }
    return null;
  }

  if (typeof value !== 'string') {
    throw Object.assign(new Error(`${field} must be text.`), { status: 400, validationError: true });
  }

  const normalized = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  if (required && !normalized) {
    throw Object.assign(new Error(`${field} is required.`), { status: 400, validationError: true });
  }

  if (normalized.length > maxLength) {
    throw Object.assign(new Error(`${field} must be ${maxLength} characters or fewer.`), { status: 400, validationError: true });
  }

  if (!multiline && /[\r\n]/.test(normalized)) {
    throw Object.assign(new Error(`${field} must be a single line.`), { status: 400, validationError: true });
  }

  return normalized || null;
}

/**
 * POST /api/v1/inquiries
 * Handles contact requests and security service consultations
 */
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ status: 'error', message: 'Request body must be a JSON object.' });
    }

    const fullName = normalizeText(body.fullName, 'Full name', 150, { required: true });
    const email = normalizeText(body.email, 'Email', 254, { required: true }).toLowerCase();
    const phone = normalizeText(body.phone, 'Phone', 50);
    const service = normalizeText(body.service, 'Service', 100);
    const facilityType = normalizeText(body.facilityType, 'Facility type', 100);
    const message = normalizeText(body.message, 'Message', 5000, { required: true, multiline: true });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ status: 'error', message: 'A valid email address is required.' });
    }

    if (phone && !/^[+()\d.\-\s]+$/.test(phone)) {
      return res.status(400).json({ status: 'error', message: 'Phone number contains unsupported characters.' });
    }

    const sanitizedData = {
      fullName,
      email,
      phone,
      service: service || 'General Inquiry',
      facilityType: facilityType || 'Not Specified',
      message,
    };

    try {
      // Ensure table exists safely
      await query(`
        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(150) NOT NULL,
          email VARCHAR(254) NOT NULL,
          phone VARCHAR(50),
          service VARCHAR(100),
          facility_type VARCHAR(100),
          message TEXT NOT NULL,
          status VARCHAR(30) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        ALTER TABLE contact_inquiries
        ALTER COLUMN email TYPE VARCHAR(254);
      `);

      const insertResult = await query(
        `INSERT INTO contact_inquiries (full_name, email, phone, service, facility_type, message)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
        [
          sanitizedData.fullName,
          sanitizedData.email,
          sanitizedData.phone,
          sanitizedData.service,
          sanitizedData.facilityType,
          sanitizedData.message,
        ]
      );

      if (insertResult && insertResult.rows && insertResult.rows.length > 0) {
        sanitizedData.referenceId = `EVT-${insertResult.rows[0].id.toString().padStart(5, '0')}`;
      }
    } catch (dbError) {
      console.error(JSON.stringify({
        event: 'inquiry.persistence_failed',
        code: dbError.code || 'DATABASE_ERROR',
      }));
      return res.status(503).json({
        status: 'error',
        message: 'We could not record your inquiry right now. Please contact our office directly or try again shortly.',
      });
    }

    if (!sanitizedData.referenceId) {
      return res.status(503).json({
        status: 'error',
        message: 'We could not record your inquiry right now. Please try again shortly.',
      });
    }

    return res.status(201).json({
      status: 'success',
      message: 'Your security inquiry has been received. Our operations team will contact you shortly.',
      data: {
        referenceId: sanitizedData.referenceId,
        service: sanitizedData.service,
        facilityType: sanitizedData.facilityType,
        storedInDatabase: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
