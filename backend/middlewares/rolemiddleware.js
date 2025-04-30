const rolemiddleware=(...allowedrole)=>{
    return(req,res,next)=>{
        if(!allowedrole.includes(req.user.role)){
            return res.status(400).send("access denied")
        }
        next()
    }

}
module.exports=rolemiddleware