export const resolveTemporalOrder = <T>(from: T, to: T, backwards: boolean) => {
    if (backwards) {
        return [to, from];
    }
    return [from, to];
};
