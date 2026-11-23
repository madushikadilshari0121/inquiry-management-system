const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
  createInquirySchema,
  updateStatusSchema,
  listQuerySchema,
} = require('../validation/inquirySchemas');
const controller = require('../controllers/inquiryController');

const router = express.Router();

router.use(requireAuth); // every inquiry route needs a signed-in user

router.get('/', validateQuery(listQuerySchema), controller.list);
router.post('/', validateBody(createInquirySchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id/status', validateBody(updateStatusSchema), controller.updateStatus);

module.exports = router;