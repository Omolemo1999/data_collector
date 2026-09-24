import { NextResponse } from "next/server";
import { savePayoutProfile } from "@/lib/storage";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const b = await request.json();
    const participantId=String(b.participantId||"");
    const accountHolderName=String(b.accountHolderName||"").trim(), bankName=String(b.bankName||"").trim();
    const accountNumber=String(b.accountNumber||"").trim(), accountType=String(b.accountType||"");
    const branchCode=String(b.branchCode||"").trim();
    if(!/^P-[A-Z0-9]{8}$/.test(participantId)) return NextResponse.json({error:"Invalid participant code."},{status:400});
    if(!accountHolderName||!bankName||!/^[0-9]{6,20}$/.test(accountNumber)||!["cheque","savings","other"].includes(accountType)||!/^[A-Za-z0-9 -]{3,20}$/.test(branchCode))
      return NextResponse.json({error:"Please provide valid bank-account details."},{status:400});
    await savePayoutProfile({participantId,accountHolderName,bankName,accountNumber,accountType:accountType as any,branchCode});
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"Could not save payout details."},{status:500}); }
}