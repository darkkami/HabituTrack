export class ReturnMessages {
    public remainingLoginAttempts: number;

    constructor(
        public type: string,
        public code: number,
        public message: string,
        public detailedMessage: string | undefined | null
    ) { }
}