interface Session {
    sessionId: string;
    lastActivityAt: string;
}

export class SessionManager {
    private sessionId: string | null = null;
    private lastActivityAt: string | null = null;

    public newActivity() {
        const currentSession = this.readSession();

        if (currentSession) {
            this.sessionId = currentSession.sessionId;
            this.lastActivityAt = currentSession.lastActivityAt;

            const currentDate = new Date();
            const lastActivityDate = new Date(this.lastActivityAt);

            const thirtyMinutes = 30 * 60 * 1000;

            const timeDifference =
                currentDate.getTime() - lastActivityDate.getTime();

            if (timeDifference < thirtyMinutes) {
                this.updateLastActivityAt(currentDate);
                return;
            }
        }

        this.createNewSession();
    }

    private readSession(): Session | null {
        const storedSession = localStorage.getItem("feedback_session");

        if (!storedSession) {
            return null;
        }

        return JSON.parse(storedSession);
    }

    private updateLastActivityAt(newActivityDate: Date) {
        this.lastActivityAt = newActivityDate.toISOString();

        const session = {
            sessionId: this.sessionId,
            lastActivityAt: this.lastActivityAt,
        };

        localStorage.setItem(
            "feedback_session",
            JSON.stringify(session)
        );
    }

    private createNewSession() {
        this.sessionId = crypto.randomUUID();
        this.lastActivityAt = new Date().toISOString();

        const session = {
            sessionId: this.sessionId,
            lastActivityAt: this.lastActivityAt,
        };

        localStorage.setItem(
            "feedback_session",
            JSON.stringify(session)
        );
    }
}