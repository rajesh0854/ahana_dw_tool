"use server";

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        const response = await axios.get('http://localhost:5000/api/license/status');
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