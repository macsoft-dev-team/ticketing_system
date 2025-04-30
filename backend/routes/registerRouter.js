const express=require('express')
const router=express.Router()
const registerConteoller=require('../controllers/registerController')


router.post('/adduser',registerConteoller.postUser)
router.get('/getuser',registerConteoller.getUser)
router.delete('/deleteuser/:id',registerConteoller.deleteUser)
router.put('/updateuser/:id',registerConteoller.updateUser)
module.exports=router