"use server";

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
    try {
        const response = await axios.post('http://localhost:5000/admin/license/deactivate');
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error deactivating license:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to deactivate license' 
            },
            { status: error.response?.status || 500 }
        );
    }
} 