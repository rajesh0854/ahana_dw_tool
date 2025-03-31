'use client';

export default function AdminLayout({ children, about, license, 'manage-users': manageUsers }) {
    return (
        <>
            {children}
            {about}
            {license}
            {manageUsers}
        </>
    );
} 