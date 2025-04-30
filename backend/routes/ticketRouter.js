const express=require('express')
const router=express.Router()
const verifyToken=require('../middlewares/authmiddleware')
const rolemiddleware=require('../middlewares/rolemiddleware')

const ticketController=require('../controllers/ticketController')


router.post('/addticket',ticketController.upload.single('picture'),ticketController.postticket)
router.get('/getticket/user',verifyToken,ticketController.getTicketUser)
router.put('/updateticket/:ticketcode',ticketController.upload.single('picture'),ticketController.updateTicketDetails)
router.delete('/deleteticket/:ticketcode',ticketController.deleteTicketDetails)
router.put('/closeticket/:ticketcode',ticketController.updateCloseTicket)
router.get('/openticketpico',ticketController.openTicketForPico)


router.post('/addmessage',ticketController.postMessage)
router.get('/message',ticketController.getMessage)
router.get('/allmessage',ticketController.getAllMessage)
router.post('/message/markAsRead',ticketController.markMessageAsRead)

module.exports=router