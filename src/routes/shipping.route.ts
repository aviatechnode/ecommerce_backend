import { Router } from 'express'
import { ShippingController } from '../controllers/shipping.controller.js'
import {
  validate,
  validationSchemas
} from '../middlewares/validation.middleware.js'

const router = Router()

const controller = new ShippingController()

// -------------------------
// SHIPPING FEE
// -------------------------

router.post(
  '/calculate',
  validate(validationSchemas.calculateShipping),
  controller.calculateShippingFee.bind(controller)
)

// -------------------------
// AVAILABLE METHODS
// -------------------------

router.get(
  '/methods',
  controller.getAvailableMethods.bind(controller)
)

export default router