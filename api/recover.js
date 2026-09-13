const {verify,sign,getBalance}=require('../lib/credits');
module.exports=async function(req,res){
  try{
    const token=String(req.query?.token||'');
    const payload=verify(token);
    if(!payload?.customerId||!payload?.email||!payload?.exp) return res.status(401).json({error:'Recovery link is invalid or expired.'});
    const balance=await getBalance(payload.customerId);
    const wallet=sign({customerId:payload.customerId});
    res.status(200).json({ok:true,wallet,balance});
  }catch(e){console.error(e);res.status(500).json({error:'Could not restore credits.'});}
};
