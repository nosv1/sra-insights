export class SessionDriver {
    // This driver comes from records that are matched with Sessions, so it'll have context for at least the session_key
    constructor(
        public steam_id: string,
        public session_key: string,
    ) { }
} 