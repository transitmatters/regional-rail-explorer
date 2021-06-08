export const resolveTemporalOrder = <T>(from: T, to: T, reverse: boolean) => {
    if (reverse) {
        return [to, from];
    }
    return [from, to];
};
