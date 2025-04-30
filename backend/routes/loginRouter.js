const express=require('express')
const router=express.Router()
const loginController=require('../controllers/loginController')

router.post('/loginuser',loginController.loginUser)





module.exports=router