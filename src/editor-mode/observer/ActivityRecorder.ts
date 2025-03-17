export class ActivityRecorder {
    private isParsing: boolean = false;
    private isObserving: boolean = false;
    private verifier = { parse: new Set(), observe: new Set() };
    enter(entry: { isParsing?: boolean, isObserving?: boolean }) {
        if (entry.isParsing) { this.isParsing = entry.isParsing }
        if (entry.isObserving) { this.isObserving = entry.isObserving }
    }
    verify(key: unknown, activity: "parse" | "observe", reset = false) {
        if (this.verifier[activity].has(key)) { return null }
        let acted = activity == "parse" ? this.isParsing : this.isObserving;
        if (reset) { this.reset(activity) }
        else { this.verifier[activity].add(key) }
        return acted;
    }
    private reset(activity: "parse" | "observe") {
        this.verifier[activity].clear();
        if (activity == "parse") {
            this.isParsing = false;
        } else {
            this.isObserving = false;
        }
    }
}