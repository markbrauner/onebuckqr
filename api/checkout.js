const {stripeClient,findCustomerByEmail}=require('../lib/credits');

const PACKS={
  1:{amount:100,label:'1 QR credit'},
  5:{amount:400,label:'5 QR credits'},
  10:{amount:700,label:'10 QR credits'}
};

module.exports=async function(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.STRIPE_SECRET_KEY) return res.status(503).json({error:'Stripe not connected'});
  try{
    const credits=Number(req.body?.credits||1);
    const pack=PACKS[credits];
    if(!pack) return res.status(400).json({error:'Choose 1, 5, or 10 QR credits.'});
    const email=String(req.body?.email||'').trim().toLowerCase();
    if(credits>1 && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:'Enter your email so your unused credits can be recovered later.'});

    const stripe=stripeClient();
    let customer=null;
    if(email){
      customer=await findCustomerByEmail(email);
      if(!customer) customer=await stripe.customers.create({email,metadata:{qr_credits:'0'}});
    }
    const origin=process.env.SITE_URL||`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const session=await stripe.checkout.sessions.create({
      mode:'payment',
      customer:customer?.id,
      customer_email:customer?undefined:(email||undefined),
      line_items:[{price_data:{currency:'usd',unit_amount:pack.amount,product_data:{name:`OneBuckQR — ${pack.label}`,description:'Static QR credits. No subscription. Unused credits never expire.'}},quantity:1}],
      metadata:{qr_credits:String(credits),credit_applied:'0'},
      success_url:`${origin}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/`,
      submit_type:'pay'
    });
    res.status(200).json({url:session.url});
  }catch(e){console.error(e);res.status(500).json({error:'Could not start checkout.'});}
};
