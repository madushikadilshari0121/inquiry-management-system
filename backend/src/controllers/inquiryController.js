const AppError = require('../utils/AppError');
const service = require('../services/inquiryService');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    throw new AppError(400, 'INVALID_ID', 'Inquiry ID must be a positive whole number');
  }
  return id;
}

async function list(req, res) {
  const inquiries = await service.listInquiries(req.user, req.validatedQuery);
  res.json({ inquiries });
}

async function getOne(req, res) {
  const inquiry = await service.getInquiry(req.user, parseId(req.params.id));
  res.json({ inquiry });
}

async function create(req, res) {
  const inquiry = await service.createInquiry(req.user, req.body);
  res.status(201).json({ inquiry });
}

async function updateStatus(req, res) {
  const inquiry = await service.updateStatus(req.user, parseId(req.params.id), req.body);
  res.json({ inquiry });
}

module.exports = { list, getOne, create, updateStatus };