
// --- Financial Helpers for Protection Simulation ---
export const annuity = (principal: number, monthlyRate: number, term: number): number => {
    if (term <= 0) return principal;
    if (monthlyRate <= 0) return principal / term;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
};

export const getBalance = (originalPrincipal: number, originalPayment: number, monthlyRate: number, monthsPaid: number): number => {
    if (monthlyRate <= 0) return originalPrincipal - (originalPayment * monthsPaid);
    return originalPrincipal * Math.pow(1 + monthlyRate, monthsPaid) - originalPayment * (Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate;
};
