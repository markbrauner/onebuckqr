const {stripeClient,addCredits,getBalance,sign}=require('../lib/credits');

module.exports=async function(req,res){
  if(!process.env.STRIPE_SECRET_KEY) return res.status(503).json({paid:false});
  try{
    const stripe=stripeClient();
    const s=await stripe.checkout.sessions.retrieve(req.query.session_id);
    if(s.payment_status!=='paid'||s.mode!=='payment') return res.status(200).json({paid:false});
    const credits=parseInt(s.metadata?.qr_credits||'1',10)||1;
    let customerId=typeof s.customer==='string'?s.customer:null;
    if(!customerId){
      const email=s.customer_details?.email;
      const c=await stripe.customers.create({email:email||undefined,metadata:{qr_credits:'0'}});
      customerId=c.id;
    }
    let balance;
    if(s.metadata?.credit_applied!=='1'){
      balance=await addCredits(customerId,credits);
      await stripe.checkout.sessions.update(s.id,{metadata:{...s.metadata,credit_applied:'1'}});
    }else balance=await getBalance(customerId);
    const wallet=sign({customerId});
    res.status(200).json({paid:true,credits,balance,wallet,email:s.customer_details?.email||null});
  }catch(e){console.error(e);res.status(400).json({paid:false});}
};
