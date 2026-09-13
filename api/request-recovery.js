const {findCustomerByEmail,sign}=require('../lib/credits');

module.exports=async function(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const email=String(req.body?.email||'').trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});
    const customer=await findCustomerByEmail(email);
    if(!customer) return res.status(200).json({ok:true});
    if(!process.env.RESEND_API_KEY) return res.status(503).json({error:'Email recovery is not connected yet.'});
    const origin=process.env.SITE_URL||`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const token=sign({customerId:customer.id,email,exp:Date.now()+30*60*1000});
    const url=`${origin}/recover.html?token=${encodeURIComponent(token)}`;
    const from=process.env.RECOVERY_FROM_EMAIL||'OneBuckQR <onboarding@resend.dev>';
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[email],subject:'Your OneBuckQR credits',html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Your OneBuckQR credits</h2><p>Use the button below to restore your unused QR credits on this device.</p><p><a href="${url}" style="display:inline-block;background:#101113;color:white;text-decoration:none;padding:14px 18px;border-radius:10px;font-weight:bold">Restore my credits</a></p><p style="color:#686a70;font-size:13px">This link expires in 30 minutes. Your purchased credits themselves never expire.</p></div>`})
    });
    if(!response.ok){console.error(await response.text());return res.status(502).json({error:'Could not send recovery email.'});}
    res.status(200).json({ok:true});
  }catch(e){console.error(e);res.status(500).json({error:'Could not start credit recovery.'});}
};
