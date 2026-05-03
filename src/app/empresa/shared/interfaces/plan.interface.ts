export interface Plan {
    id: string;
    name: string;
    price: number;
    period: string;
    features: string[];
    popular?: boolean;
    current?: boolean;
}
