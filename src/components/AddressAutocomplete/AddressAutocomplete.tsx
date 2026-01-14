import React, { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";

import styles from "./AddressAutocomplete.module.scss";

type AddressResult = {
    display_name: string;
    lat: string;
    lon: string;
};

export type AddressSelection = {
    label: string;
    lat: number;
    lon: number;
};

type Props = {
    value: string;
    placeholder?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onSelect: (selection: AddressSelection) => void;
    onFocus?: () => void;
    onBlur?: () => void;
};

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 300;
const FREEFORM_MIN_LENGTH = 5;

const fetchAddressResults = async (query: string, signal?: AbortSignal) => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", query);
    url.searchParams.set("countrycodes", "us");
    url.searchParams.set("viewbox", "-71.85,42.95,-70.45,41.95");
    const res = await fetch(url.toString(), { signal });
    return (await res.json()) as AddressResult[];
};

const formatSelection = (result: AddressResult): AddressSelection => ({
    label: result.display_name,
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
});

const AddressAutocomplete: React.FunctionComponent<Props> = ({
    value,
    placeholder = "Search for an address...",
    disabled,
    onChange,
    onSelect,
    onFocus,
    onBlur,
}) => {
    const [query, setQuery] = useState(value || "");
    const [results, setResults] = useState<AddressResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const lastRequestRef = useRef(0);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) {
            setResults([]);
            return;
        }
        const requestId = Date.now();
        lastRequestRef.current = requestId;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
            fetchAddressResults(trimmed, controller.signal)
                .then((data) => {
                    if (lastRequestRef.current === requestId) {
                        setResults(data);
                        setIsOpen(true);
                    }
                })
                .catch(() => {
                    if (lastRequestRef.current === requestId) {
                        setResults([]);
                    }
                });
        }, SEARCH_DEBOUNCE_MS);
        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [query]);

    const items = useMemo(() => results.map(formatSelection), [results]);

    const selectResult = (selection: AddressSelection) => {
        setQuery(selection.label);
        setResults([]);
        setIsOpen(false);
        onSelect(selection);
    };

    const runFreeformLookup = async () => {
        const trimmed = query.trim();
        if (trimmed.length < FREEFORM_MIN_LENGTH) {
            return;
        }
        try {
            const data = await fetchAddressResults(trimmed);
            if (data.length > 0) {
                selectResult(formatSelection(data[0]));
            }
        } catch {
            setResults([]);
        }
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (evt) => {
        if (evt.key === "Enter" && items.length > 0) {
            evt.preventDefault();
            selectResult(items[0]);
            return;
        }
        if (evt.key === "Enter") {
            evt.preventDefault();
            runFreeformLookup();
        }
    };

    return (
        <div className={classNames(styles.addressAutocomplete, "address-picker")}>
            <input
                type="text"
                value={query}
                disabled={disabled}
                className={styles.input}
                placeholder={placeholder}
                onFocus={() => {
                    setIsOpen(true);
                    onFocus?.();
                }}
                onBlur={() => {
                    setIsOpen(false);
                    runFreeformLookup();
                    onBlur?.();
                }}
                onKeyDown={handleKeyDown}
                onChange={(evt) => {
                    const nextValue = evt.target.value;
                    setQuery(nextValue);
                    onChange(nextValue);
                }}
            />
            {isOpen && items.length > 0 && (
                <div className={styles.results}>
                    {items.map((item) => (
                        <button
                            key={`${item.label}-${item.lat}-${item.lon}`}
                            type="button"
                            className={styles.result}
                            onMouseDown={(evt) => {
                                evt.preventDefault();
                                selectResult(item);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;
