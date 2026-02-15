export const isAdmin = (email: string | undefined): boolean => {
    if (!email) return false;

    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase());

    return adminList.includes(email.toLowerCase());
};
