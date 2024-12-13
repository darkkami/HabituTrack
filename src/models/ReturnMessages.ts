export class ReturnMessages {
    public remainingLoginAttempts: number;

    constructor(
        public status: string,
        public code: number,
        public message: string,
        public detailedMessage: string | undefined | null
    ) { }
}