const {findCustomerByEmail,sign,getBalance}=require('../lib/credits');

module.exports=async function(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const email=String(req.body?.email||'').trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});

    const customer=await findCustomerByEmail(email);
    if(!customer) return res.status(404).json({error:'We could not find unused OneBuckQR credits for that email. Check the address and try again.'});
    const balance=await getBalance(customer.id);
    if(balance < 1) return res.status(404).json({error:'We found that email, but there are no unused OneBuckQR credits to restore.'});

    const resendKey=process.env.RESEND_API_KEY||process.env.MESSAGING_API_KEY;
    if(!resendKey) return res.status(503).json({error:'Email recovery is not connected in production yet.'});

    const origin=process.env.SITE_URL||`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const token=sign({customerId:customer.id,email,exp:Date.now()+30*60*1000});
    const url=`${origin}/recover.html?token=${encodeURIComponent(token)}`;
    const from=process.env.RECOVERY_FROM_EMAIL||'OneBuckQR <credits@onebuckqr.com>';
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[email],subject:'Your OneBuckQR credits',html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Your OneBuckQR credits</h2><p>You currently have <b>${balance}</b> unused QR credit${balance===1?'':'s'}.</p><p>Use the button below to restore them on this device.</p><p><a href="${url}" style="display:inline-block;background:#176b45;color:white;text-decoration:none;padding:14px 18px;border-radius:10px;font-weight:bold">Restore my credits</a></p><p style="color:#686a70;font-size:13px">This link expires in 30 minutes. Your purchased credits themselves never expire. If you do not see this email in your inbox, check spam or junk.</p></div>`})
    });
    if(!response.ok){
      const detail=await response.text();
      console.error('Resend recovery failure:',detail);
      return res.status(502).json({error:'We found your credits, but the recovery email could not be sent. Please try again in a moment.'});
    }
    res.status(200).json({ok:true,balance});
  }catch(e){
    console.error('Recovery request failure:',e);
    res.status(500).json({error:'Could not start credit recovery. Please try again.'});
  }
};
