const db = require("../model/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const loginUser = async (req, res) => {
  const { phoneNo, password } = req.body;
  try {
    const sql = "SELECT * FROM userdetails WHERE phoneNo=?";
    const [result] = await db.query(sql, [phoneNo]);

    if (result.length === 0) {
     return res.status(404).send("User Not Found");
    }

    const user = result[0];
    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
      return res.status(404).send("invalid Password");
    }
    const token = jwt.sign({id:user.id, phoneNo: user.phoneNo , role: user.role }, process.env.jwt_key, {expiresIn: "1d", });
    res.status(200).send({token});
    console.log(token);
  } catch (error) {
    console.log(error)
    return res.status(400).send('Something went wrong. Please try again later');
  }
};


module.exports = { loginUser };
