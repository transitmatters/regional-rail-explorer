export class NavigationFailedError extends Error {
    constructor(message: string = "Navigation failed") {
        super(message);
        this.name = "NavigationFailedError";
    }
}
