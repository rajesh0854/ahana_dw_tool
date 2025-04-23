"use server";

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/license/status`);
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching license status:', error);
        return NextResponse.json(
            { 
                valid: false, 
                status: 'error',
                message: 'Failed to check license status' 
            },
            { status: 500 }
        );
    }
} 