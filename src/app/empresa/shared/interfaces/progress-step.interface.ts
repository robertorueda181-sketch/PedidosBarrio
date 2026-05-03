export interface ProgressStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
  isPro?: boolean;
  action?: string;
}
