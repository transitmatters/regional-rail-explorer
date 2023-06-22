import { useEffect, useState } from "react";
import { NextRouter, useRouter } from "next/router";

type EncodedField<T> = {
    initial: null | T;
    param: string;
    encode: (t: T) => string;
    decode: (s: string) => T;
};
type StringField = { initial: null | string; param: string };
type Field<T> = StringField | EncodedField<T>;
type Fields = Record<string, Field<any>>;
type State<F extends Fields> = { [k in keyof F]: F[k]["initial"] };

interface RouterTransitionOptions {
    replace: boolean;
    shallow: boolean;
}

type RouterTransitionFn<F extends Fields> = (
    oldState: State<F>,
    newState: State<F>
) => RouterTransitionOptions;

const defaultRouterTransitionFn = () => {
    return {
        replace: true,
        shallow: true,
    };
};

const normalizeQuery = (
    query: Record<string, string | string[] | undefined>
): Record<string, string> => {
    const normalized: Record<string, string> = {};
    Object.entries(query).forEach(([key, value]) => {
        if (value) {
            if (Array.isArray(value)) {
                normalized[key] = value[0];
            } else {
                normalized[key] = value;
            }
        }
    });
    return normalized;
};

const decodeField = <T>(value: string, field: Field<T>): T => {
    if ("decode" in field) {
        return field.decode(value);
    }
    return value as unknown as T;
};

const encodeField = <T>(value: T, field: Field<T>): string => {
    if ("encode" in field) {
        return field.encode(value);
    }
    return value as unknown as string;
};

const getInitialStateFromFields = <F extends Fields>(fields: F): State<F> => {
    const state = {};
    Object.entries(fields).forEach(([key, value]) => {
        state[key] = value.initial;
    });
    return state as State<F>;
};

const getStateFromQuery = <F extends Fields>(
    fields: F,
    query: Record<string, string>
): State<F> => {
    const state = {};
    Object.entries(fields).forEach(([key, field]) => {
        const queryValue = query[field.param] || "";
        state[key] = queryValue ? decodeField(queryValue, field) : field.initial;
    });
    return state as State<F>;
};

const getQueryStringFromState = <F extends Fields>(fields: F, state: State<F>): string => {
    const query: Record<string, string> = {};
    Object.entries(fields).forEach(([key, field]) => {
        const value = encodeField(state[key], field);
        if (value || typeof value === "number") {
            query[field.param] = value;
        }
    });
    return new URLSearchParams(query).toString();
};

const performRouterTransition = <F extends Fields>(
    router: NextRouter,
    queryString: string,
    oldState: State<F>,
    newState: State<F>,
    transitionFn: RouterTransitionFn<F>
) => {
    const { replace, shallow } = transitionFn(oldState, newState);
    const method = replace ? router.replace.bind(router) : router.push.bind(router);
    const path = `${location.pathname}?${queryString}`;
    method(path, undefined, { shallow });
    return path;
};

export const useRouterBoundState = <F extends Fields>(
    fields: F,
    transitionFn: RouterTransitionFn<F> = defaultRouterTransitionFn
) => {
    const router = useRouter();
    const [routedToPath, setRoutedToPath] = useState<null | string>(null);
    const [state, setState] = useState<State<F>>(() =>
        router
            ? getStateFromQuery(fields, normalizeQuery(router.query))
            : getInitialStateFromFields(fields)
    );

    const updateState = (patch: Partial<State<F>>) => {
        setState((currentState) => {
            const nextState = { ...currentState, ...patch };
            const queryString = getQueryStringFromState(fields, nextState);
            const nextRoutedToPath = performRouterTransition(
                router,
                queryString,
                currentState,
                nextState,
                transitionFn
            );
            setRoutedToPath(nextRoutedToPath);
            return nextState;
        });
    };

    useEffect(() => {
        if (router && router.asPath && router.asPath !== routedToPath) {
            setRoutedToPath(null);
            setState(getStateFromQuery(fields, normalizeQuery(router.query)));
        }
    }, [router?.query]);

    return [state, updateState] as const;
};
