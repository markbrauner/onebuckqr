const {verify,getBalance,useCredit}=require('../lib/credits');
module.exports=async function(req,res){
  try{
    const token=String(req.body?.wallet||req.query?.wallet||'');
    const p=verify(token);
    if(!p?.customerId) return res.status(401).json({error:'Wallet not recognized.'});
    if(req.method==='GET') return res.status(200).json({balance:await getBalance(p.customerId)});
    if(req.method==='POST'){
      const result=await useCredit(p.customerId);
      if(!result.ok) return res.status(402).json({error:'No QR credits remaining.',balance:0});
      return res.status(200).json(result);
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){console.error(e);res.status(500).json({error:'Could not access credits.'});}
};
