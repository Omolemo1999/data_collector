import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getPayoutProfile } from "@/lib/storage";
export const runtime="nodejs";
export async function GET(request:Request){
 if(!(await isAdmin())) return NextResponse.json({error:"Unauthorized."},{status:401});
 const id=new URL(request.url).searchParams.get("participantId")||"";
 const profile=await getPayoutProfile(id);
 return NextResponse.json({profile});
}