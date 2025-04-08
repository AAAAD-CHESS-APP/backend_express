const AdminPasskey = (req,res,next)=>{
    const {passkey} = req.body;
    if(passkey!="DEMO_PASSKEY") {
        req.ValidPasskey = false;
       res.status(400).send("Passkey is incorrect");
    }
    else req.ValidPasskey = true;
    next();
}
module.exports = AdminPasskey;
