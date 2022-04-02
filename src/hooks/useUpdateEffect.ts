import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export const useUpdateEffect = (fn: EffectCallback, dependencies?: DependencyList) => {
    const didMountRef = useRef(false);
    useEffect(() => {
        if (didMountRef.current) {
            return fn();
        }
        didMountRef.current = true;
    }, dependencies);
};
