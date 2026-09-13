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
  const result = await stripe.customers.list({email, limit:10});
  if(!result.data.length) return null;
  return result.data.sort((a,b)=>(b.created||0)-(a.created||0))[0];
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
