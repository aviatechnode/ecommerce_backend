import { Router } from 'express'
import { ShippingRateController } from '../controllers/shipping-rate.controller.js'

const router = Router()
const controller = new ShippingRateController()

router.get('/zones/:zoneId/rates', controller.getZoneRates.bind(controller))
router.post('/rates/calculate', controller.getBestRate.bind(controller))
router.post('/rates', controller.createRate.bind(controller))
router.patch('/rates/:id/toggle', controller.toggleRate.bind(controller))
router.delete('/rates/:id', controller.deleteRate.bind(controller))

export default router