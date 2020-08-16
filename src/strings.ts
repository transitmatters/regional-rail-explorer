export const pluralize = (str: string | { singular: string; plural: string }, n: number) => {
    if (typeof str === "string") {
        if (n === 1) {
            return str;
        }
        const useEsEndings = ["s", "sh", "ch", "x", "z"];
        if (useEsEndings.some((ending) => str.endsWith(ending))) {
            return `${str}es`;
        }
        return `${str}s`;
    }
    return n === 1 ? str.singular : str.plural;
};

const strConcat = (...strings) => strings.reduce((acc, str) => acc + str, "");

interface JoinOxfordOptions<T> {
    joiner?: (arr: T[]) => T;
    empty?: T;
    ampersand?: boolean;
}

export const joinOxford = <T>(items: T[], options: JoinOxfordOptions<T> = {}) => {
    const { joiner = strConcat, empty = "", ampersand = false } = options;
    const twoAnd = ampersand ? " & " : " and ";
    const manyAnd = ampersand ? " & " : ", and ";
    if (items.length === 0) {
        return empty;
    }
    return items.reduce((acc, item, index) =>
        joiner(acc, items.length === 2 ? twoAnd : index === items.length - 1 ? manyAnd : ", ", item)
    );
};
