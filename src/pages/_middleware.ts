import { NextRequest, NextResponse } from "next/server";

export default (req: NextRequest) => {
    console.log(req.nextUrl);
    return NextResponse.next();
};
