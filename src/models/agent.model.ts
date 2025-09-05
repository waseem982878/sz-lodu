
export interface Agent {
    id: string;
    name: string;
    email: string;
    floatBalance: number; // The total amount given to the agent by admin
    usedAmount: number; // The total amount of withdrawals approved by the agent
    remainingBalance: number; // Calculated field: floatBalance - usedAmount
    isActive: boolean;
}
