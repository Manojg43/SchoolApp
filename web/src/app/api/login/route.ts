import { NextResponse } from 'next/server';

const DJANGO_API_URL = 'http://127.0.0.1:8000/api/login/';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        console.log("Proxying Login Request to:", DJANGO_API_URL);

        const res = await fetch(DJANGO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Parse Response
        const data = await res.json();

        console.log("Django Response Status:", res.status);

        return NextResponse.json(data, { status: res.status });

    } catch (error: any) {
        console.error("Login Proxy Error:", error);
        return NextResponse.json(
            { error: 'Connection to Backend Failed', details: error.message },
            { status: 500 }
        );
    }
}
