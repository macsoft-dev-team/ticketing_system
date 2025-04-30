const con = require('../model/db')
const db=require('../model/db')
const bcrypt=require('bcrypt')


const postUser= async(req,res)=>{
    const {name,phoneNo,password,role}=req.body
    try{
        const userRole=role || 'user'
        const checkUser='SELECT * FROM userdetails WHERE phoneNo=?'
       const [result]=  await db.query(checkUser,[phoneNo])
         
        if(result.length>0){
            res.status(401).send("user already exist")
        }else{
            const hashpassword= await bcrypt.hash(password,10);
            const sql='INSERT INTO userdetails (name,phoneNo,password,role) VALUES(?,?,?,?)'
             await db.query(sql,[name,phoneNo,hashpassword,userRole])
               res.status(200).send('user Registered')
        }
    }catch(error){
        return res.status(400).send({error: error.message})
    }
}
// const getUser=async(req,res)=>{
//     try{
//         const sql="SELECT * FROM userdetails"
//         const [result]=await db.query(sql) 
//         const getUserId="SELECT id FROM userdetails"
//          const [userID]=await db.query(getUserId)
//          const ticketCount=[]
//          for (let user of userID){
//             const user_id=user.id
//             const ticketPerUser="SELECT COUNT(*) AS ticketCount FROM ticketdetails WHERE user_id=? "
//             const [ticketResult]=await db.query(ticketPerUser,[user_id])
//             ticketCount.push({
//                 ticketCount:ticketResult[0].ticketCount
//             })
//          }        
//           res.status(200).send({result,ticketCount:ticketCount})
//     }catch(error){
//         res.status(400).send(error)
//     }
// }
const getUser = async (req, res) => {
    try {
        const sql = "SELECT * FROM userdetails";
        const [result] = await db.query(sql);

        const ticketCount = [];

        for (let user of result) {
            const user_id = user.id;  
            const ticketPerUser = "SELECT COUNT(*) AS ticketCount FROM ticketdetails WHERE user_id = ?";
            const [ticketResult] = await db.query(ticketPerUser, [user_id]);
            ticketCount.push({
                user_id: user_id,
                ticketCount: ticketResult[0].ticketCount 
            });
        }
        const userWithTicketCount = result.map(user => {
            const userTicket = ticketCount.find(ticket => ticket.user_id === user.id);
            return { ...user, ticketCount: userTicket ? userTicket.ticketCount : 0 }
        });

        res.status(200).send(userWithTicketCount);
      //  console.log(userWithTicketCount)
    } catch (error) {
        res.status(400).send(error);
    }
};


const updateUser=async(req,res)=>{
    const {id}=req.params
    const {role}=req.body
    try{
        const sql='UPDATE userdetails SET role=? WHERE id=?'
        await db.query(sql,[role,id])
        res.status(200).send(`role updated to ${role}`)
    }catch(error){
        res.status(400).send(error)
    }
}

const deleteUser=async(req,res)=>{
    const {id}=req.params
    try{
        const sql='DELETE FROM userdetails WHERE id=?'
        await db.query(sql,[id])
        res.status(200).send("deleted successfully....!")

    }catch(error){
        res.status(400).send(error)
    }
}

module.exports={postUser,getUser,deleteUser,updateUser}