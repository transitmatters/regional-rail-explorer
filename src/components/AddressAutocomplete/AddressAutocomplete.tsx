import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./AddressAutocomplete.module.scss";

export type AddressSelection = {
    label: string;
    lat: number;
    lon: number;
};

type Suggestion = AddressSelection & {
    id: string;
    rawLabel: string;
};

type Props = {
    value: string;
    placeholder?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onSelect: (selection: AddressSelection) => void;
};

const buildSuggestionsUrl = (query: string) => {
    const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        limit: "6",
        q: query,
        countrycodes: "us",
    });
    return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
};

const AddressAutocomplete: React.FunctionComponent<Props> = ({
    value,
    placeholder = "Enter an address",
    disabled,
    onChange,
    onSelect,
}) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const requestId = useRef(0);

    const normalizedQuery = useMemo(() => value.trim(), [value]);

    const fetchSuggestions = useCallback(async (query: string, activeRequest: number) => {
        const res = await fetch(buildSuggestionsUrl(query));
        const data = await res.json();
        if (activeRequest !== requestId.current) {
            return;
        }
        const next = (data || []).map((item: any, index: number) => ({
            id: `${item.place_id ?? index}`,
            label: item.display_name,
            rawLabel: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
        }));
        setSuggestions(next);
        setIsOpen(next.length > 0);
    }, []);

    useEffect(() => {
        if (disabled) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        if (normalizedQuery.length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        const nextRequest = requestId.current + 1;
        requestId.current = nextRequest;
        const timeout = window.setTimeout(() => {
            fetchSuggestions(normalizedQuery, nextRequest).catch(() => {
                if (nextRequest === requestId.current) {
                    setSuggestions([]);
                    setIsOpen(false);
                }
            });
        }, 200);
        return () => window.clearTimeout(timeout);
    }, [normalizedQuery, disabled, fetchSuggestions]);

    const handleSelect = useCallback(
        (suggestion: Suggestion) => {
            onChange(suggestion.rawLabel);
            onSelect({ label: suggestion.rawLabel, lat: suggestion.lat, lon: suggestion.lon });
            setSuggestions([]);
            setIsOpen(false);
        },
        [onChange, onSelect]
    );

    const handleBlur = useCallback(() => {
        window.setTimeout(() => {
            setIsOpen(false);
            if (normalizedQuery.length >= 3 && suggestions.length > 0) {
                handleSelect(suggestions[0]);
            }
        }, 150);
    }, [normalizedQuery.length, suggestions, handleSelect]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter" && suggestions.length > 0) {
                event.preventDefault();
                handleSelect(suggestions[0]);
            }
        },
        [suggestions, handleSelect]
    );

    return (
        <div className={styles.wrapper}>
            <input
                className={styles.input}
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                onFocus={() => setIsOpen(suggestions.length > 0)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={disabled}
            />
            {isOpen && suggestions.length > 0 && (
                <div className={styles.suggestions}>
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.id}
                            type="button"
                            className={styles.suggestion}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelect(suggestion)}
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;
