const crypto = require('crypto');
const Stripe = require('stripe');

function stripeClient(){
  if(!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not connected');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function tokenSecret(){
  return process.env.WALLET_SIGNING_SECRET || process.env.STRIPE_SECRET_KEY;
}

function sign(payload){
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token){
  if(!token || !token.includes('.')) return null;
  const [body,sig] = token.split('.');
  const expected = crypto.createHmac('sha256', tokenSecret()).update(body).digest('base64url');
  try{
    if(!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    if(payload.exp && Date.now() > payload.exp) return null;
    return payload;
  }catch{ return null; }
}

async function findCustomerByEmail(email){
  const stripe = stripeClient();
  const wanted = String(email || '').trim().toLowerCase();
  if(!wanted) return null;

  // Stripe's email filter can miss older/case-varied duplicates. For this small
  // service, inspect the current customer set and prefer a customer that actually
  // has recoverable QR credits.
  const result = await stripe.customers.list({limit:100});
  const matches = result.data.filter(c => !c.deleted && String(c.email || '').trim().toLowerCase() === wanted);
  if(!matches.length) return null;
  return matches.sort((a,b) => {
    const ac = Math.max(0, parseInt(a.metadata?.qr_credits || '0',10) || 0);
    const bc = Math.max(0, parseInt(b.metadata?.qr_credits || '0',10) || 0);
    if(bc !== ac) return bc - ac;
    return (b.created || 0) - (a.created || 0);
  })[0];
}

async function getBalance(customerId){
  const stripe = stripeClient();
  const c = await stripe.customers.retrieve(customerId);
  if(c.deleted) throw new Error('Customer not found');
  return Math.max(0, parseInt(c.metadata?.qr_credits || '0',10) || 0);
}

async function setBalance(customerId,balance){
  const stripe = stripeClient();
  const c = await stripe.customers.update(customerId,{metadata:{qr_credits:String(Math.max(0,balance))}});
  return parseInt(c.metadata.qr_credits || '0',10) || 0;
}

async function addCredits(customerId,count){
  const current = await getBalance(customerId);
  return setBalance(customerId,current + count);
}

async function useCredit(customerId){
  const current = await getBalance(customerId);
  if(current < 1) return {ok:false,balance:0};
  const balance = await setBalance(customerId,current - 1);
  return {ok:true,balance};
}

module.exports = {stripeClient,sign,verify,findCustomerByEmail,getBalance,addCredits,useCredit};
