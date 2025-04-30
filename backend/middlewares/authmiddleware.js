const jwt=require('jsonwebtoken')


const verifyToken=(req,res,next)=>{
    let token;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer')){
        token=authHeader.split(' ')[1];
    }

    if (!token){
        return res.status(401).send({ message: "No token provided. Authorization denied." })
    }

    try{
        const decode=jwt.verify(token,process.env.jwt_key)
        req.user=decode;
        next()
    }catch(error){
        res.status(400).send(error)
    }

}

module.exports=verifyToken